from pydantic import BaseModel
from typing import Optional

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