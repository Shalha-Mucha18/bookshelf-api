from fastapi import FastAPI
from src.books.routes import book_router
from contextlib import asynccontextmanager
from src.db.main import init_db
from src.auth.routers import auth
from src.reviews.routers import reviews_router
from src.tags.routes import tags_router

@asynccontextmanager
async def life_span(app: FastAPI):

    print("Starting up books app...")
    await init_db()
    yield
    print("Shutting down books app...")

version = "1.0.0"


app = FastAPI(
    version=version,
    title="Book Catalog API",
    description="A simple API for managing a book catalog",
)

app.include_router(book_router, prefix=f"/api/v{version}/books", tags=["Books"])
app.include_router(auth, prefix=f"/api/v{version}/auth", tags=["Auth"])
app.include_router(reviews_router, prefix=f"/api/v{version}/reviews", tags=["Reviews"])
app.include_router(tags_router, prefix=f"/api/v{version}/tags", tags=["Tags"])