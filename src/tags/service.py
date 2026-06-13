import uuid
from sqlmodel import select, desc
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.models import Tag, Book, BookTag
from .schemas import TagCreateModel, TagAddModel
from error import TagNotFound, BookNotFound


class TagService:

    async def get_tags(self, session: AsyncSession) -> list[Tag]:
        statement = select(Tag).order_by(desc(Tag.created_at))
        result = await session.execute(statement)
        return result.scalars().all()

    async def get_tag_by_uid(self, session: AsyncSession, tag_uid: uuid.UUID) -> Tag:
        statement = select(Tag).where(Tag.uid == tag_uid)
        result = await session.execute(statement)
        tag = result.scalars().first()
        if not tag:
            raise TagNotFound()
        return tag

    async def add_tag(self, tag_data: TagCreateModel, session: AsyncSession) -> Tag:
        new_tag = Tag(**tag_data.model_dump())
        session.add(new_tag)
        await session.commit()
        await session.refresh(new_tag)
        return new_tag

    async def update_tag(
        self, tag_uid: uuid.UUID, tag_update_data: TagCreateModel, session: AsyncSession
    ) -> Tag:
        tag = await self.get_tag_by_uid(session, tag_uid)
        tag.name = tag_update_data.name
        session.add(tag)
        await session.commit()
        await session.refresh(tag)
        return tag

    async def delete_tag(self, tag_uid: uuid.UUID, session: AsyncSession) -> Tag:
        tag = await self.get_tag_by_uid(session, tag_uid)
        await session.delete(tag)
        await session.commit()
        return tag

    async def add_tags_to_book(
        self, book_uid: str, tag_data: TagAddModel, session: AsyncSession
    ) -> Book:
        statement = select(Book).where(Book.uid == book_uid)
        result = await session.execute(statement)
        book = result.scalars().first()

        if not book:
            raise BookNotFound()

        for tag_uid in tag_data.tag_uids:
            tag = await self.get_tag_by_uid(session, tag_uid)
            if tag not in book.tags:
                book_tag = BookTag(book_id=book.uid, tag_id=tag.uid)
                session.add(book_tag)

        await session.commit()
        await session.refresh(book)
        return book

