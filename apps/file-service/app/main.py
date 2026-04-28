from fastapi import FastAPI
from app.api.upload import router as upload_router

app = FastAPI(title="FlowStack File Service", version="0.1.0")

app.include_router(upload_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
