# file-service

Python · FastAPI · Celery · Pillow · MinIO

Async file processing pipeline. Receives upload tasks, transforms images, stores results in S3.

## Stack

- **API**: FastAPI
- **Workers**: Celery
- **Broker / backend**: Redis
- **Image processing**: Pillow
- **Storage**: MinIO (S3-compatible)

## Task lifecycle

```
upload → pending → processing → done
                             └→ failed (retry ×3, then dead-letter)
```

## Dev

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # API
celery -A worker worker --loglevel=info  # Worker
```
