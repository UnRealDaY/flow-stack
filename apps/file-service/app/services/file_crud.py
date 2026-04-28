from datetime import datetime
from sqlalchemy.orm import Session
from app.models.file_record import FileRecord, FileStatus


def get_by_idempotency_key(db: Session, key: str) -> FileRecord | None:
    return db.query(FileRecord).filter(FileRecord.idempotency_key == key).first()


def create(
    db: Session,
    *,
    idempotency_key: str,
    workspace_id: str,
    original_key: str,
) -> FileRecord:
    record = FileRecord(
        idempotency_key=idempotency_key,
        workspace_id=workspace_id,
        original_key=original_key,
        status=FileStatus.PENDING,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_status(
    db: Session,
    *,
    record_id: str,
    status: FileStatus,
    processed_key: str | None = None,
    error: str | None = None,
) -> None:
    db.query(FileRecord).filter(FileRecord.id == record_id).update(
        {
            "status":        status,
            "processed_key": processed_key,
            "error":         error,
            "updated_at":    datetime.utcnow(),
        },
        synchronize_session=False,
    )
    db.commit()


def get_by_id(db: Session, record_id: str) -> FileRecord | None:
    return db.query(FileRecord).filter(FileRecord.id == record_id).first()
