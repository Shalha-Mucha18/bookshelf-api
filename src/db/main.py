from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from src.db.models import User, Book
from src.books.config import settings
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
engine = create_async_engine(
    url=settings.database_url,
    echo=True,
)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        result = await conn.execute(text("SELECT 'connection test successful!'"))
        print(result.scalar())

async def get_session():
          session = sessionmaker(engine, 
                                 expire_on_commit=False, 
                                 class_=AsyncSession)
          async with session() as session:
                yield session

                