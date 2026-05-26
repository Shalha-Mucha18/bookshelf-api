from typing import List

from fastapi import APIRouter, HTTPException, status

from .schema import Book, BookUpdate
from .book_data import books

book_router = APIRouter()


@book_router.get("/", response_model=List[Book])
async def get_all_books():
    return books


@book_router.post("/", status_code=status.HTTP_201_CREATED, response_model=Book)
async def add_book(book_data: Book):
    new_book = book_data.model_dump()
    new_book["id"] = max((b["id"] for b in books), default=0) + 1
    books.append(new_book)
    return new_book


@book_router.get("/{book_id}", response_model=Book)
async def get_book_by_id(book_id: int):
    for book in books:
        if book["id"] == book_id:
            return book
    raise HTTPException(status_code=404, detail="Book not found")


@book_router.patch("/{book_id}", response_model=Book)
async def update_book(book_id: int, book_data: BookUpdate):
    for book in books:
        if book["id"] == book_id:
            book.update(book_data.model_dump(exclude_unset=True))
            return book
    raise HTTPException(status_code=404, detail="Book not found")


@book_router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: int):
    for index, book in enumerate(books):
        if book["id"] == book_id:
            del books[index]
            return
    raise HTTPException(status_code=404, detail="Book not found")
