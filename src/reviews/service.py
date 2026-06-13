from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, desc

from src.auth.service import AuthService
from src.books.service import BookService
from src.db.models import Review
from .schemas import ReviewCreateModel
from error import UserNotFound, InsufficientPermission


book_service = BookService()
user_service = AuthService()


class ReviewService:
    async def add_review_to_book(
        self,
        user_email: str,
        book_uid: str,
        review_data: ReviewCreateModel,
        session: AsyncSession,
    ):
        # get_book_by_uid raises 404 if the book does not exist.
        book = await book_service.get_book_by_uid(session=session, book_uid=book_uid)
        user = await user_service.get_user_by_mail(session=session, email=user_email)

        if not user:
            raise UserNotFound()

        review_data_dict = review_data.model_dump()
        new_book_review = Review(
            **review_data_dict, user_uid=user.uid, book_uid=book.uid
        )

        session.add(new_book_review)
        await session.commit()
        await session.refresh(new_book_review)

        return new_book_review

    async def get_review(self, review_uid: str, session: AsyncSession):
        statement = select(Review).where(Review.uid == review_uid)
        result = await session.exec(statement)
        return result.first()

    async def get_all_reviews(self, session: AsyncSession):
        statement = select(Review).order_by(desc(Review.created_at))
        result = await session.exec(statement)
        return result.all()

    async def delete_review(
        self, review_uid: str, user_email: str, session: AsyncSession
    ):
        user = await user_service.get_user_by_mail(session=session, email=user_email)
        review = await self.get_review(review_uid, session)

        if not review or (review.user != user):
            raise InsufficientPermission()

        await session.delete(review)
        await session.commit()
