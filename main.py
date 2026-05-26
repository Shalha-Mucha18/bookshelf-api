from fastapi import FastAPI, Header, status
from typing import Optional
from pydantic import BaseModel
from typing import List
from fastapi import HTTPException

app = FastAPI()
books = [
    {
        "id": 1,
        "title": "Think Python",
        "author": "Allen B. Downey",
        "publisher": "O'Reilly Media",
        "published_date": "2021-01-01",
        "page_count": 1234,
        "language": "English",
    },
    {
        "id": 2,
        "title": "Django By Example",
        "author": "Antonio Mele",
        "publisher": "Packt Publishing Ltd",
        "published_date": "2022-01-19",
        "page_count": 1023,
        "language": "English",
    },
    {
        "id": 3,
        "title": "Fluent Python",
        "author": "Luciano Ramalho",
        "publisher": "O'Reilly Media",
        "published_date": "2022-04-12",
        "page_count": 1012,
        "language": "English",
    },
]



class Book(BaseModel):
    title: str
    author: str
    publisher: str
    published_date: str
    page_count: int
    language: str

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    page_count: Optional[int] = None
    language: Optional[str] = None
@app.get("/get-books", response_model=List[Book])
async def get_all_books():
    return books

@app.post("/add-book")
async def add_book(book_data: Book,status_code=status.HTTP_201_CREATED) -> Book:
    
    new_book = book_data.model_dump()
    books.append(new_book)
    return new_book

@app.get("/get-book/{book_id}", response_model=Book)
async def get_book_by_id(book_id: int):
    for book in books:
        if book["id"] == book_id:
            return book
        
    raise HTTPException(status_code=404, detail="Book not found")

@app.patch("/update-book/{book_id}",status_code=status.HTTP_200_OK) 
async def update_book(book_id: int, book_data: BookUpdate):
    for book in books:
        if book["id"] == book_id:
            if book_data.title is not None:
                book["title"] = book_data.title
            if book_data.author is not None:
                book["author"] = book_data.author
            if book_data.page_count is not None:
                book["page_count"] = book_data.page_count
            if book_data.language is not None:
                book["language"] = book_data.language
            return book
        
    raise HTTPException(status_code=404, detail="Book not found")


@app.delete("/delete-book/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: int):
    for index, book in enumerate(books):
        if book["id"] == book_id:
            del books[index]
            return "Book deleted successfully"
        
    raise HTTPException(status_code=404, detail="Book not found")

