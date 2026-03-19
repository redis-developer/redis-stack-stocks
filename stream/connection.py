
import os
from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
db = AsyncRedis.from_url(redis_url, decode_responses=True)
db_sync = Redis.from_url(redis_url, decode_responses=True)
