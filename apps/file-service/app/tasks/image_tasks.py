import boto3
import redis
import json
from io import BytesIO
from PIL import Image
from celery_worker import celery_app
from app.config import settings

_redis = redis.from_url(settings.redis_url)

_s3 = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
    region_name=settings.s3_region,
)


def _publish_event(channel: str, event: str, data: dict) -> None:
    _redis.publish("events", json.dumps({"channel": channel, "event": event, "data": data}))


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def process_image(self, file_id: str, s3_key: str, workspace_id: str, options: dict):
    try:
        # Download
        obj = _s3.get_object(Bucket=settings.s3_bucket, Key=s3_key)
        raw = obj["Body"].read()

        # Transform
        img = Image.open(BytesIO(raw))
        width = options.get("width", 1024)
        height = options.get("height")
        fmt = options.get("format", "WEBP").upper()
        quality = options.get("quality", 85)

        if height:
            img = img.resize((width, height), Image.LANCZOS)
        else:
            ratio = width / img.width
            img = img.resize((width, int(img.height * ratio)), Image.LANCZOS)

        buf = BytesIO()
        img.save(buf, format=fmt, quality=quality, optimize=True)
        buf.seek(0)

        # Upload processed file
        out_key = s3_key.replace("uploads/", "processed/")
        _s3.put_object(
            Bucket=settings.s3_bucket,
            Key=out_key,
            Body=buf,
            ContentType=f"image/{fmt.lower()}",
        )

        _publish_event(
            f"workspace:{workspace_id}",
            "file:processed",
            {"fileId": file_id, "status": "done", "key": out_key},
        )

    except Exception as exc:
        _publish_event(
            f"workspace:{workspace_id}",
            "file:processed",
            {"fileId": file_id, "status": "failed"},
        )
        raise self.retry(exc=exc)
