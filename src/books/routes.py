import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from .schema import Book, BookCreate, BookUpdate
from .service import BookService
from src.db.main import get_session

book_router = APIRouter()
service = BookService()


# get all books
@book_router.get("/", response_model=List[Book])
async def get_all_books(session: AsyncSession = Depends(get_session)):
    return await service.get_all_books(session)


# create a new book
@book_router.post("/", status_code=status.HTTP_201_CREATED, response_model=Book)
async def add_book(book_data: BookCreate, session: AsyncSession = Depends(get_session)):
    return await service.create_book(session, book_data)


# get a book by UID
@book_router.get("/{book_uid}", response_model=Book)
async def get_book_by_uid(book_uid: uuid.UUID, session: AsyncSession = Depends(get_session)):
    return await service.get_book_by_uid(session, book_uid)


# update a book by UID
@book_router.patch("/{book_uid}", response_model=Book)
async def update_book(book_uid: uuid.UUID, book_data: BookUpdate, session: AsyncSession = Depends(get_session)):
    return await service.update_book(session, book_uid, book_data)


# delete a book by UID
@book_router.delete("/{book_uid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_uid: uuid.UUID, session: AsyncSession = Depends(get_session)):
    return await service.delete_book(session, book_uid)
