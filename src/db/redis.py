import redis.asyncio as aioredis
from src.books.config import settings
from src.auth.utils import ACCESS_TOKEN_EXPIRY

token_blocklist = aioredis.from_url(f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}", decode_responses=True)


async def add_jti_to_blocklist(jti: str) -> None:
    await token_blocklist.set(name=jti, value="", ex=ACCESS_TOKEN_EXPIRY)


async def token_in_blocklist(jti: str) -> bool:
    jti = await token_blocklist.get(jti)
    return jti is not None
