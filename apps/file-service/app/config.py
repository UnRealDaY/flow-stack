from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    database_url: str
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "flowstack"
    s3_region: str = "us-east-1"
    max_file_size_mb: int = 20

    class Config:
        env_file = "../../.env"


settings = Settings()
