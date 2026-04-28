from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from app.config import settings
from app.db import get_session
from app.services.s3 import s3
from app.services import file_crud
from app.tasks.image_tasks import process_image

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES     = settings.max_file_size_mb * 1024 * 1024


@router.post("/image", status_code=202)
async def upload_image(
    file: UploadFile = File(...),
    x_workspace_id:    str = Header(...),
    x_idempotency_key: str = Header(...),
    db: Session = Depends(get_session),
):
    # ── Idempotency check ────────────────────────────────────────────────────
    existing = file_crud.get_by_idempotency_key(db, x_idempotency_key)
    if existing:
        return {
            "fileId":     existing.id,
            "status":     existing.status.value,
            "idempotent": True,
        }

    # ── Validate ─────────────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, f"Unsupported media type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(413, f"File exceeds {settings.max_file_size_mb} MB limit")

    # ── Upload raw file to S3 ─────────────────────────────────────────────────
    s3_key = f"uploads/{x_workspace_id}/{x_idempotency_key}/{file.filename}"
    s3.upload(s3_key, content, file.content_type or "application/octet-stream")

    # ── Persist record with status=pending ───────────────────────────────────
    record = file_crud.create(
        db,
        idempotency_key=x_idempotency_key,
        workspace_id=x_workspace_id,
        original_key=s3_key,
    )

    # ── Dispatch async task ───────────────────────────────────────────────────
    process_image.delay(
        record_id=record.id,
        s3_key=s3_key,
        workspace_id=x_workspace_id,
        options={"width": 1024, "format": "WEBP", "quality": 85},
    )

    return {"fileId": record.id, "status": "pending"}


@router.get("/image/{file_id}")
def get_file_status(file_id: str, db: Session = Depends(get_session)):
    record = file_crud.get_by_id(db, file_id)
    if not record:
        raise HTTPException(404, "File not found")
    return record.to_dict()
