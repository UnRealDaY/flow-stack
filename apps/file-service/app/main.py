from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.db import SessionLocal
from app.services.notifier import notifier
from app.api.upload import router as upload_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once on startup — safe no-op if tables already exist (Alembic handles creation)
    yield


app = FastAPI(title="FlowStack File Service", version="0.1.0", lifespan=lifespan)

app.include_router(upload_router, prefix="/api/v1")


@app.get("/health")
def health():
    db_status    = "ok"
    redis_status = "ok"

    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "unreachable"

    if not notifier.ping():
        redis_status = "unreachable"

    healthy = db_status == "ok" and redis_status == "ok"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={"status": "ok" if healthy else "error", "db": db_status, "redis": redis_status},
    )
