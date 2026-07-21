# Bookly

**A full-stack book catalogue application.** Track the books you own, rate and review what you've read, and organise your collection with tags — behind email-verified accounts and JWT authentication, with all transactional email delivered asynchronously.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.139-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-5-37814A?logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Running the application](#running-the-application)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)

## Features

- **Secure authentication** — email-verified sign-up, JWT access and refresh tokens, server-side token revocation on logout, and password reset by email
- **Book catalogue** — create, edit, delete and browse books with instant search
- **Reviews and ratings** — 1–5 star ratings with written reviews and per-book averages
- **Tagging** — organise books by genre, mood or project with flexible tags
- **Asynchronous email** — verification and password-reset emails are dispatched through a Celery worker, keeping API responses fast
- **Role-based access control** — `user` and `admin` roles; unverified accounts are gated from protected endpoints
- **Modern interface** — responsive Next.js UI with dark-mode support

## Architecture

```
                ┌──────────────────────┐
                │   Next.js frontend   │   React 19 · TypeScript · Tailwind
                │   localhost:3000     │
                └──────────┬───────────┘
                           │ REST + JWT
                ┌──────────▼───────────┐
                │   FastAPI backend    │   SQLModel · Pydantic v2 · async
                │   localhost:8000     │
                └───┬──────────────┬───┘
                    │              │ enqueue
          ┌─────────▼──┐      ┌───▼────────┐      ┌───────────────┐
          │ PostgreSQL │      │   Redis    │◄─────┤ Celery worker │
          │  (asyncpg) │      │ broker +   │ jobs │  (SMTP email) │
          └────────────┘      │ blocklist  │      └───────────────┘
                              └────────────┘
```

**Design notes**

- The backend and frontend are independent applications that communicate only over HTTP, so each can be developed, tested and deployed separately.
- Authentication is stateless: short-lived access tokens (20 minutes) are refreshed transparently by the frontend using a 2-day refresh token. Revoked tokens are tracked in a Redis blocklist checked on every authenticated request.
- Email never blocks a request: sign-up and password-reset endpoints enqueue a Celery task and return immediately; the worker handles SMTP delivery.

## Getting started

### Prerequisites

| Requirement | Version |
|---|---|
| Python with [uv](https://docs.astral.sh/uv/) | 3.14+ |
| Node.js | 20+ |
| PostgreSQL | 17 |
| Redis | 7 (e.g. `docker run -d --name bookshelf-redis -p 6379:6379 redis:7`) |

### 1. Create the database

```bash
createdb bookshelf
```

### 2. Configure the backend

```bash
cd backend
uv venv .venv --python 3.14
uv pip install -p .venv/bin/python -r requirements.txt
```

Create `backend/.env`:

```ini
DATABASE_URL=postgresql+asyncpg://<user>:<password>@localhost:5432/bookshelf
JWT_SECRET=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
JWT_ALGORITHM=HS256
REDIS_HOST=localhost
REDIS_PORT=6379

MAIL_USERNAME=<your gmail address>
MAIL_PASSWORD=<16-character Gmail app password>
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM=<your gmail address>
MAIL_FROM_NAME=Bookly

# Host that email links point to (the frontend dev server)
DOMAIN=localhost:3000
```

> [!IMPORTANT]
> Gmail SMTP rejects regular account passwords. Enable 2-Step Verification, then create an **app password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) and use the 16-character code (without spaces) as `MAIL_PASSWORD`.

Initialise the database tables (first run only):

```bash
.venv/bin/python -c "import asyncio; from src.db.main import init_db; asyncio.run(init_db())"
```

### 3. Configure the frontend

```bash
cd frontend
npm install
```

`frontend/.env.local` — adjust only if the API runs on a different host:

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1.0.0
```

## Running the application

Start three processes in separate terminals:

```bash
# API server — http://localhost:8000 (Swagger UI at /docs)
cd backend && .venv/bin/uvicorn main:app --reload

# Celery worker — delivers verification and password-reset emails
cd backend && .venv/bin/celery -A src.celery_tasks.c_app worker --loglevel=INFO

# Frontend — http://localhost:3000
cd frontend && npm run dev
```

Open **http://localhost:3000**, create an account, follow the verification link sent to your inbox, and log in.

**Promoting an administrator** — new accounts receive the `user` role. Tag creation and the broadcast email endpoint require `admin`:

```bash
psql -d bookshelf -c "UPDATE \"user\" SET role='admin' WHERE email='<your email>';"
```

## API reference

All routes are prefixed with `/api/v1.0.0`. Interactive documentation is served at [localhost:8000/docs](http://localhost:8000/docs). Authenticated endpoints expect an `Authorization: Bearer <access token>` header; the frontend's API client attaches and refreshes tokens automatically.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/sign-up` | Create an account and send a verification email |
| `GET` | `/auth/verify/{token}` | Activate an account from the emailed link |
| `POST` | `/auth/login` | Exchange credentials for access and refresh tokens |
| `POST` | `/auth/refresh` | Mint a new access token from a refresh token |
| `POST` | `/auth/logout` | Revoke the current token |
| `GET` | `/auth/me` | Current user's profile with books and reviews |
| `POST` | `/auth/password-reset-request` | Send a password-reset link |
| `POST` | `/auth/password-reset-confirm/{token}` | Set a new password |
| `POST` | `/auth/send_mail` | Broadcast an email *(admin)* |

### Books

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/books/` | List all books with reviews and tags |
| `POST` | `/books/` | Add a book |
| `GET` | `/books/{uid}` | Retrieve a single book |
| `PATCH` | `/books/{uid}` | Update a book |
| `DELETE` | `/books/{uid}` | Delete a book |

### Reviews

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reviews/book/{book_uid}` | Review a book (1–5 stars and text) |
| `GET` | `/reviews/{uid}` | Retrieve a single review |
| `GET` | `/reviews/` | List all reviews *(admin)* |
| `DELETE` | `/reviews/{uid}` | Delete a review |

### Tags

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tags/` | List tags |
| `POST` | `/tags/` | Create a tag *(admin)* |
| `POST` | `/tags/{tag_uid}/books/{book_uid}` | Attach a tag to a book |
| `PUT` | `/tags/{tag_uid}` | Rename a tag |
| `DELETE` | `/tags/{tag_uid}` | Delete a tag |

## Project structure

```
bookshelf-api/
├── backend/
│   ├── main.py               # ASGI entrypoint (uvicorn main:app)
│   ├── error.py              # domain exceptions and JSON error handlers
│   ├── requirements.txt
│   └── src/
│       ├── auth/             # routes, JWT utilities, dependencies, schemas
│       ├── books/            # book CRUD and application settings
│       ├── reviews/          # review routes and service
│       ├── tags/             # tag routes and service
│       ├── db/               # async engine, models, Redis token blocklist
│       ├── mail.py           # fastapi-mail configuration
│       └── celery_tasks.py   # asynchronous email task
└── frontend/
    └── src/
        ├── lib/              # typed API client, auth context
        ├── components/       # navbar, book cards, forms, UI primitives
        └── app/              # routes: books, profile, login, signup,
                              # verify/[token], password-reset-confirm/[token]
```

## Tech stack

| Layer | Technologies |
|---|---|
| API | FastAPI, SQLModel (async SQLAlchemy), Pydantic v2 |
| Data | PostgreSQL (asyncpg), Redis |
| Auth | PyJWT, passlib + bcrypt, itsdangerous |
| Background jobs | Celery with Redis broker, fastapi-mail |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |

---

Contributions are welcome — please open an issue or submit a pull request.
