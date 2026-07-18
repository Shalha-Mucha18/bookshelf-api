# Bookly 

A full-stack book catalogue: track the books you own, rate and review them, and organise your shelf with tags. Email-verified accounts, JWT authentication, and asynchronous email delivery via Celery.

```
bookshelf-api/
├── backend/     FastAPI + PostgreSQL + Redis + Celery
└── frontend/    Next.js (App Router) + TypeScript + Tailwind CSS
```

## Features

- **Accounts** — sign up with email verification, JWT login (access + refresh tokens), logout with server-side token revocation, password reset by email
- **Books** — add, edit, delete, and browse books with search and generated cover art
- **Reviews** — 1–5 star ratings with text reviews, per-book averages
- **Tags** — create tags (admin) and attach them to books
- **Email** — verification and password-reset emails sent asynchronously through a Celery worker over Gmail SMTP
- **Roles** — `user` / `admin`; unverified accounts are blocked from protected endpoints

## Tech stack

| Layer | Technology |
|---|---|
| API | FastAPI, SQLModel (async SQLAlchemy), Pydantic v2 |
| Database | PostgreSQL via asyncpg |
| Auth | PyJWT access/refresh tokens, passlib + bcrypt, itsdangerous URL-safe tokens |
| Queue | Celery with Redis broker; Redis also backs the JWT blocklist |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |

## Prerequisites

- Python 3.14+ and [uv](https://docs.astral.sh/uv/) (or pip)
- Node.js 20+
- PostgreSQL 17
- Redis (e.g. `docker run -d --name bookshelf-redis -p 6379:6379 redis:7`)

## Setup

### 1. Database

```bash
createdb bookshelf
```

### 2. Backend

```bash
cd backend
uv venv .venv --python 3.14
uv pip install -p .venv/bin/python -r requirements.txt
```

Create `backend/.env`:

```ini
DATABASE_URL=postgresql+asyncpg://<user>:<password>@localhost:5432/bookshelf
JWT_SECRET=<generate one: python -c "import secrets; print(secrets.token_hex(32))">
JWT_ALGORITHM=HS256
REDIS_HOST=localhost
REDIS_PORT=6379

MAIL_USERNAME=<your gmail address>
MAIL_PASSWORD=<a 16-character Gmail app password>
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM=<your gmail address>
MAIL_FROM_NAME=Bookly

# Where email links point (the frontend dev server)
DOMAIN=localhost:3000
```

> **Gmail note:** regular account passwords are rejected by Gmail SMTP. Enable 2-Step Verification, then create an app password at <https://myaccount.google.com/apppasswords> and paste the 16-character code (no spaces).

Create the tables (first run only):

```bash
.venv/bin/python -c "import asyncio; from src.db.main import init_db; asyncio.run(init_db())"
```

### 3. Frontend

```bash
cd frontend
npm install
```

`frontend/.env.local` (created automatically, adjust if your API runs elsewhere):

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1.0.0
```

## Running

Three processes (plus Postgres and Redis):

```bash
# 1. API — http://localhost:8000 (Swagger UI at /docs)
cd backend && .venv/bin/uvicorn main:app --reload

# 2. Celery worker — delivers verification/reset emails
cd backend && .venv/bin/celery -A src.celery_tasks.c_app worker --loglevel=INFO

# 3. Frontend — http://localhost:3000
cd frontend && npm run dev
```

Then open **http://localhost:3000**, sign up, click the verification link in your inbox, and log in.

### Promoting an admin

New accounts get the `user` role. Tag creation and the `/send_mail` endpoint require `admin`:

```bash
psql -d bookshelf -c "UPDATE \"user\" SET role='admin' WHERE email='<your email>';"
```

## API overview

All routes are prefixed with `/api/v1.0.0`. Interactive docs at `http://localhost:8000/docs`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/sign-up`, `GET /auth/verify/{token}`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/password-reset-request`, `POST /auth/password-reset-confirm/{token}`, `POST /auth/send_mail` (admin) |
| Books | `GET /books/`, `POST /books/`, `GET /books/{uid}`, `PATCH /books/{uid}`, `DELETE /books/{uid}` |
| Reviews | `GET /reviews/` (admin), `POST /reviews/book/{book_uid}`, `GET /reviews/{uid}`, `DELETE /reviews/{uid}` |
| Tags | `GET /tags/`, `POST /tags/` (admin), `POST /tags/{tag_uid}/books/{book_uid}`, `PUT /tags/{tag_uid}`, `DELETE /tags/{tag_uid}` |

Authenticated endpoints expect an `Authorization: Bearer <access token>` header. Access tokens last 20 minutes; the frontend refreshes them automatically using the 2-day refresh token.

## Project layout

```
backend/
├── main.py               # ASGI entrypoint (uvicorn main:app)
├── error.py              # exception classes + handlers
├── requirements.txt
└── src/
    ├── auth/             # routes, JWT utils, dependencies, schemas
    ├── books/            # book CRUD + app settings (config.py)
    ├── reviews/          # review routes and service
    ├── tags/             # tag routes and service
    ├── db/               # engine, models, Redis token blocklist
    ├── mail.py           # fastapi-mail configuration
    └── celery_tasks.py   # async email task

frontend/
└── src/
    ├── lib/              # typed API client, auth context
    ├── components/       # navbar, book cards, forms, UI primitives
    └── app/              # pages: books, profile, login, signup,
                          # verify/[token], password-reset-confirm/[token]
```
