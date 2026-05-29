from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
import uuid


class UserCreateModel(BaseModel):

    user_name: str = Field(max_length=50, example="John Doe")
    email: str = Field(max_length=100, example="john.doe@example.com")
    password: str = Field(min_length=8, max_length=128, example="password123")

