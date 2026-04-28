import logging
from io import BytesIO
from PIL import Image
from celery_worker import celery_app
from app.db import SessionLocal
from app.models.file_record import FileStatus
from app.services import file_crud
from app.services.s3 import s3
from app.services.notifier import notifier

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=3,
    acks_late=True,
    reject_on_worker_lost=True,
)
def process_image(self, record_id: str, s3_key: str, workspace_id: str, options: dict):
    db = SessionLocal()
    try:
        # ── 1. Mark processing ────────────────────────────────────────────────
        file_crud.update_status(db, record_id=record_id, status=FileStatus.PROCESSING)

        # ── 2. Download raw file from S3 ──────────────────────────────────────
        raw = s3.download(s3_key)

        # ── 3. Transform with Pillow ──────────────────────────────────────────
        processed_bytes, out_key = _transform(raw, s3_key, options)

        # ── 4. Upload processed file to S3 ────────────────────────────────────
        fmt = options.get("format", "WEBP").lower()
        s3.upload(out_key, processed_bytes, f"image/{fmt}")

        # ── 5. Mark done + notify ─────────────────────────────────────────────
        file_crud.update_status(
            db, record_id=record_id, status=FileStatus.DONE, processed_key=out_key
        )
        notifier.publish(workspace_id, "file:processed", {
            "fileId": record_id, "status": "done", "key": out_key,
        })

    except Exception as exc:
        if self.request.retries < self.max_retries:
            # Exponential backoff: 10s → 20s → 40s
            countdown = (2 ** self.request.retries) * 10
            logger.warning(
                "process_image retry %d/%d in %ds: %s",
                self.request.retries + 1, self.max_retries, countdown, exc,
            )
            db.close()
            raise self.retry(exc=exc, countdown=countdown)

        # ── Dead letter: all retries exhausted ────────────────────────────────
        error_msg = str(exc)[:500]
        logger.error("process_image failed permanently for %s: %s", record_id, error_msg)
        file_crud.update_status(
            db, record_id=record_id, status=FileStatus.FAILED, error=error_msg
        )
        notifier.publish(workspace_id, "file:processed", {
            "fileId": record_id, "status": "failed",
        })
        raise  # Let Celery mark the task FAILURE in its backend

    finally:
        db.close()


def _transform(raw: bytes, s3_key: str, options: dict) -> tuple[bytes, str]:
    """Resize and convert an image. Returns (bytes, out_s3_key)."""
    img = Image.open(BytesIO(raw))

    # Normalise colour mode — WEBP/JPEG don't support RGBA
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    width   = options.get("width", 1024)
    height  = options.get("height")
    fmt     = options.get("format", "WEBP").upper()
    quality = options.get("quality", 85)

    if height:
        img = img.resize((width, height), Image.LANCZOS)
    else:
        ratio = width / img.width
        img   = img.resize((width, int(img.height * ratio)), Image.LANCZOS)

    buf = BytesIO()
    save_kwargs: dict = {"format": fmt, "optimize": True}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
    if fmt == "WEBP" and img.mode == "RGBA":
        save_kwargs.pop("optimize", None)  # WEBP lossless path
    img.save(buf, **save_kwargs)

    # Build output key: swap prefix + change extension
    out_key = s3_key.replace("uploads/", "processed/", 1)
    base    = out_key.rsplit(".", 1)[0]
    out_key = f"{base}.{fmt.lower()}"

    return buf.getvalue(), out_key
