import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Enum, DateTime, Text, Index
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class FileStatus(str, enum.Enum):
    PENDING    = "pending"
    PROCESSING = "processing"
    DONE       = "done"
    FAILED     = "failed"


class FileRecord(Base):
    __tablename__ = "file_records"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    idempotency_key = Column(String, nullable=False, unique=True, index=True)
    workspace_id    = Column(String, nullable=False, index=True)
    original_key    = Column(String, nullable=False)   # S3 key of raw upload
    processed_key   = Column(String, nullable=True)    # S3 key after transform
    status          = Column(Enum(FileStatus), nullable=False, default=FileStatus.PENDING)
    error           = Column(Text, nullable=True)
    created_at      = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at      = Column(DateTime, nullable=False, default=datetime.utcnow,
                             onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "workspaceId":   self.workspace_id,
            "status":        self.status.value,
            "originalKey":   self.original_key,
            "processedKey":  self.processed_key,
            "error":         self.error,
            "createdAt":     self.created_at.isoformat(),
        }
