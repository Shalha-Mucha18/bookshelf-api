import uuid

from fastapi import HTTPException, status
from sqlmodel import select, desc
from sqlmodel.ext.asyncio.session import AsyncSession

from .models import Book
from .schema import BookCreate, BookUpdate


class BookService:

    async def get_all_books(self, session: AsyncSession) -> list[Book]:
        statement = select(Book).order_by(desc(Book.created_at))
        result = await session.execute(statement)
        return result.scalars().all()

    async def get_book_by_uid(self, session: AsyncSession, book_uid: uuid.UUID) -> Book:
        statement = select(Book).where(Book.uid == book_uid)
        result = await session.execute(statement)
        book = result.scalars().first()
        if not book:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        return book

    async def create_book(self, session: AsyncSession, user_id: uuid.UUID, book: BookCreate) -> Book:
        new_book = Book(**book.model_dump())

        new_book.user_id = user_id
        session.add(new_book)
        await session.commit()
        await session.refresh(new_book)
        return new_book

    async def update_book(self, session: AsyncSession, book_uid: uuid.UUID, book: BookUpdate) -> Book:
        book_to_update = await self.get_book_by_uid(session, book_uid)
        for key, value in book.model_dump(exclude_unset=True).items():
            setattr(book_to_update, key, value)
        session.add(book_to_update)
        await session.commit()
        await session.refresh(book_to_update)
        return book_to_update

    async def delete_book(self, session: AsyncSession, book_uid: uuid.UUID) -> None:
        book_to_delete = await self.get_book_by_uid(session, book_uid)
        await session.delete(book_to_delete)
        await session.commit()

    async def get_user_books(self, user_uid: str, session: AsyncSession) -> list[Book]:
        statement = select(Book).where(Book.user_id == user_uid).order_by(desc(Book.created_at))
        result = await session.execute(statement)
        return result.scalars().all()
