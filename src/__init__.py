from fastapi import FastAPI
from src.books.routes import book_router

version = "1.0.0"


app = FastAPI(
    version=version,
    title="Book Catalog API",
    description="A simple API for managing a book catalog",
)

app.include_router(book_router, prefix=f"/api/v{version}/books", tags=["Books"])