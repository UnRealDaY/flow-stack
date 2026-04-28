import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from app.config import settings
from app.tasks.image_tasks import process_image
import boto3

router = APIRouter(prefix="/upload", tags=["upload"])

_s3 = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
    region_name=settings.s3_region,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = settings.max_file_size_mb * 1024 * 1024


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    x_workspace_id: str = Header(...),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Unsupported media type")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(413, f"File exceeds {settings.max_file_size_mb}MB limit")

    file_id = str(uuid.uuid4())
    s3_key = f"uploads/{x_workspace_id}/{file_id}/{file.filename}"

    _s3.put_object(
        Bucket=settings.s3_bucket,
        Key=s3_key,
        Body=content,
        ContentType=file.content_type or "application/octet-stream",
    )

    task = process_image.delay(
        file_id=file_id,
        s3_key=s3_key,
        workspace_id=x_workspace_id,
        options={"width": 1024, "format": "WEBP", "quality": 85},
    )

    return {"fileId": file_id, "taskId": task.id, "status": "pending"}
