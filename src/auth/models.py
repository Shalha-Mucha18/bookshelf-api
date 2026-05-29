from datetime import datetime, date, timezone
from sqlmodel import SQLModel, Field, Column
import sqlalchemy.dialects.postgresql as pg
import uuid

# User model for authentication and user management
class User(SQLModel, table=True):
    __tablename = "users"
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
    hashed_password: str = Field(exclude=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), default=datetime.now(timezone.utc)))


    def __repr__(self):
        return f"User(uid={self.uid}, username='{self.username}', email='{self.email}', first_name='{self.first_name}', last_name='{self.last_name}', is_verified={self.is_verified}, created_at={self.created_at}, updated_at={self.updated_at})"