from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.models.file_record import Base

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,   # reconnects silently after DB restart
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_session():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all tables that don't yet exist. Used as a dev fallback."""
    Base.metadata.create_all(bind=engine)
