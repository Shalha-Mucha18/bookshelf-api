from fastapi import FastAPI
from src.auth.routers import auth
from src.books.routes import book_router
from src.reviews.routers import reviews_router
from src.tags.routes import tags_router
from error import register_error_handlers
from src.middleware import register_middleware

version = "1.0.0"

app = FastAPI(
    title="Book Catalog API",
    description="A simple API for managing a book catalog",
    version=version,
)

register_error_handlers(app)
register_middleware(app)

app.include_router(book_router, prefix=f"/api/v{version}/books", tags=["Books"])
app.include_router(auth, prefix=f"/api/v{version}/auth", tags=["Auth"])
app.include_router(reviews_router, prefix=f"/api/v{version}/reviews", tags=["Reviews"])
app.include_router(tags_router, prefix=f"/api/v{version}/tags", tags=["Tags"])