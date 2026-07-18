from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from typing import List
from datetime import datetime, date
import uuid
from src.books.schema import BookCreate
from src.books.schema import Book
from src.reviews.schemas import ReviewModel


class UserCreateModel(BaseModel):
    username: str = Field(max_length=50)
    email: EmailStr = Field(max_length=100)
    first_name: str = Field(max_length=50)
    last_name: str = Field(max_length=50)
    password: str = Field(min_length=8, max_length=128)


class UserModel(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}

class UserBooksModel(UserModel):
    books: List[Book]  
    reviews: List[ReviewModel]
  
class UserLoginModel(BaseModel):
    email: EmailStr = Field(max_length=100)
    password: str = Field(min_length=6)

class EmailModel(BaseModel):
    addresses: List[EmailStr]