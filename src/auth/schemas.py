from pydantic import BaseModel, Field
from typing import Optional
from typing import List
from datetime import datetime, date
import uuid
from src.books.schema import BookCreate


class UserCreateModel(BaseModel):
    username: str = Field(max_length=50)
    email: str = Field(max_length=100)
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
    books: Optional[List[BookCreate]] = None

    model_config = {"from_attributes": True}



class UserLoginModel(BaseModel):
    email: str = Field(max_length=40)
    password: str = Field(min_length=6)      