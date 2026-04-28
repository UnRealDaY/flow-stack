from io import BytesIO
import boto3
from app.config import settings


class S3Service:
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
        )

    def upload(self, key: str, body: bytes | BytesIO, content_type: str) -> None:
        self._client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=body,
            ContentType=content_type,
        )

    def download(self, key: str) -> bytes:
        obj = self._client.get_object(Bucket=settings.s3_bucket, Key=key)
        return obj["Body"].read()


# Module-level singleton — shared across all requests in the same process
s3 = S3Service()
