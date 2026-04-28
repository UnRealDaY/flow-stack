import json
import redis as redis_lib
from app.config import settings


class Notifier:
    def __init__(self) -> None:
        self._redis = redis_lib.from_url(settings.redis_url, decode_responses=True)

    def publish(self, workspace_id: str, event: str, data: dict) -> None:
        payload = json.dumps({
            "channel": f"workspace:{workspace_id}",
            "event":   event,
            "data":    data,
        })
        self._redis.publish("events", payload)

    def ping(self) -> bool:
        try:
            return self._redis.ping()
        except Exception:
            return False


notifier = Notifier()
