from datetime import datetime, date, timezone
from sqlmodel import SQLModel, Field, Column
import sqlalchemy.dialects.postgresql as pg
import uuid


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
    language: str
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))

    def __repr__(self):
        return f"<Book uid={self.uid} title={self.title!r}>"
