from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from src.books.config import settings


engine = create_async_engine(
    url=settings.database_url,
    echo=True,
)


async def init_db():
    async with engine.begin() as conn:
        statement = text("SELECT 'Hello, World!'")
        result = await conn.execute(statement)
        print(result.scalar())
