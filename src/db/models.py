from datetime import datetime, date, timezone
from sqlmodel import SQLModel, Field, Column, Relationship
from sqlalchemy import ForeignKey
import sqlalchemy.dialects.postgresql as pg
import uuid
from typing import List, Optional

# User model for authentication and user management
class User(SQLModel, table=True):
    uid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            unique=True,
        ),
    )
    username: str = Field(..., index=True, unique=True)   
    email: str = Field(..., index=True, unique=True)
    first_name: str
    last_name: str
    role: str = Field(
        sa_column=Column(pg.VARCHAR, nullable=False, server_default="user")
    )
    hashed_password: str = Field(exclude=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))

    books: List["Book"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})


    def __repr__(self):
        return f"User(uid={self.uid}, username='{self.username}', email='{self.email}', first_name='{self.first_name}', last_name='{self.last_name}', is_verified={self.is_verified}, created_at={self.created_at}, updated_at={self.updated_at})"


class Book(SQLModel, table=True):
    uid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            unique=True,
        ),
    )
    title: str = Field(..., index=True)
    author: str
    publisher: str
    published_date: date           
    page_count: int
    user_id: uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            ForeignKey("user.uid"),
            nullable=False,
        )
    )
    language: str
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))
    user: Optional["User"] = Relationship(
        back_populates="books", sa_relationship_kwargs={"lazy": "selectin"}
    )
    def __repr__(self):
        return f"<Book uid={self.uid} title={self.title!r}>"
 
    
