<div align="center">

# 📚 Bookly

### Your bookshelf, beautifully organised.

A full-stack book catalogue — track the books you own, rate and review what you've read, and tag your collection so you can always find the right book.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.139-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-5-37814A?logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) · [Architecture](#-architecture) · [Quick start](#-quick-start) · [API reference](#-api-reference) · [Project layout](#-project-layout)

</div>

---

## ✨ Features

| | |
|---|---|
| 🔐 **Secure accounts** | Email-verified sign-up, JWT access + refresh tokens, server-side token revocation on logout, and password reset by email |
| 📖 **Book catalogue** | Add, edit, delete and browse books with instant search and generated cover art |
| ⭐ **Reviews & ratings** | 1–5 star ratings with written reviews and live per-book averages |
| 🏷️ **Flexible tagging** | Group books by genre, mood or project; attach tags from the book page |
| ✉️ **Async email** | Verification and password-reset emails delivered through a Celery worker — API responses never wait on SMTP |
| 👥 **Role-based access** | `user` / `admin` roles; unverified accounts are gated from protected endpoints |
| 🌗 **Polished UI** | Responsive Next.js interface with dark-mode support and a warm, library-inspired design |

## 🏗 Architecture

```
                ┌──────────────────────┐
                │   Next.js frontend   │  ← React 19 · TypeScript · Tailwind
                │   localhost:3000     │
                └──────────┬───────────┘
                           │ REST + JWT
                ┌──────────▼───────────┐
                │    FastAPI backend   │  ← SQLModel · Pydantic v2 · async
                │    localhost:8000    │
                └───┬──────────────┬───┘
                    │              │ enqueue
          ┌─────────▼──┐      ┌───▼────────┐      ┌──────────────┐
          │ PostgreSQL │      │   Redis    │◄─────┤Celery worker │
          │  (asyncpg) │      │broker + JWT│ jobs │ (SMTP email) │
          └────────────┘      │ blocklist  │      └──────────────┘
                              └────────────┘
```

- **Two independent apps, one repo** — `backend/` (FastAPI) and `frontend/` (Next.js) communicate only over HTTP, so each can be developed, tested and deployed on its own.
- **Stateless auth** — short-lived access tokens (20 min) are refreshed transparently by the frontend using a 2-day refresh token; revoked tokens are tracked in a Redis blocklist.
- **Email off the hot path** — sign-up and password-reset requests enqueue a Celery task and return immediately; the worker handles Gmail SMTP delivery and retries.

## 🚀 Quick start

### Prerequisites

| Tool | Version |
|---|---|
| Python + [uv](https://docs.astral.sh/uv/) | 3.14+ |
| Node.js | 20+ |
| PostgreSQL | 17 |
| Redis | 7 — e.g. `docker run -d --name bookshelf-redis -p 6379:6379 redis:7` |

### 1 · Database

```bash
createdb bookshelf
```

### 2 · Backend

```bash
cd backend
uv venv .venv --python 3.14
uv pip install -p .venv/bin/python -r requirements.txt
```

Create `backend/.env`:

```ini
DATABASE_URL=postgresql+asyncpg://<user>:<password>@localhost:5432/bookshelf
JWT_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(32))">
JWT_ALGORITHM=HS256
REDIS_HOST=localhost
REDIS_PORT=6379

MAIL_USERNAME=<your gmail address>
MAIL_PASSWORD=<16-character Gmail app password>
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM=<your gmail address>
MAIL_FROM_NAME=Bookly

# Where email links point (the frontend dev server)
DOMAIN=localhost:3000
```

> [!IMPORTANT]
> Gmail SMTP rejects regular account passwords. Enable 2-Step Verification, then create an **app password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) and paste the 16-character code without spaces.

Initialise the tables (first run only):

```bash
.venv/bin/python -c "import asyncio; from src.db.main import init_db; asyncio.run(init_db())"
```

### 3 · Frontend

```bash
cd frontend
npm install
```

`frontend/.env.local` (adjust only if your API runs elsewhere):

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1.0.0
```

### 4 · Run

Three processes, three terminals:

```bash
# API — http://localhost:8000 (Swagger UI at /docs)
cd backend && .venv/bin/uvicorn main:app --reload

# Celery worker — delivers verification & reset emails
cd backend && .venv/bin/celery -A src.celery_tasks.c_app worker --loglevel=INFO

# Frontend — http://localhost:3000
cd frontend && npm run dev
```

Open **http://localhost:3000** → sign up → click the verification link in your inbox → log in → start shelving. 🎉

<details>
<summary><strong>Promoting an admin</strong></summary>

New accounts get the `user` role. Creating tags and the broadcast `/send_mail` endpoint require `admin`:

```bash
psql -d bookshelf -c "UPDATE \"user\" SET role='admin' WHERE email='<your email>';"
```

</details>

## 📡 API reference

All routes are prefixed with `/api/v1.0.0` — interactive docs at [localhost:8000/docs](http://localhost:8000/docs).

<details open>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/sign-up` | Create an account & send verification email |
| `GET` | `/auth/verify/{token}` | Activate an account from the emailed link |
| `POST` | `/auth/login` | Exchange credentials for access + refresh tokens |
| `POST` | `/auth/refresh` | Mint a new access token from a refresh token |
| `POST` | `/auth/logout` | Revoke the current token (Redis blocklist) |
| `GET` | `/auth/me` | Current profile with books & reviews |
| `POST` | `/auth/password-reset-request` | Email a password-reset link |
| `POST` | `/auth/password-reset-confirm/{token}` | Set a new password |
| `POST` | `/auth/send_mail` | Broadcast an email — **admin only** |

</details>

<details>
<summary><strong>Books</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/books/` | List all books with reviews & tags |
| `POST` | `/books/` | Add a book to your shelf |
| `GET` | `/books/{uid}` | Book detail |
| `PATCH` | `/books/{uid}` | Update a book |
| `DELETE` | `/books/{uid}` | Remove a book |

</details>

<details>
<summary><strong>Reviews</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reviews/book/{book_uid}` | Review a book (1–5 stars + text) |
| `GET` | `/reviews/{uid}` | Single review |
| `GET` | `/reviews/` | All reviews — **admin only** |
| `DELETE` | `/reviews/{uid}` | Delete a review |

</details>

<details>
<summary><strong>Tags</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tags/` | List tags |
| `POST` | `/tags/` | Create a tag — **admin only** |
| `POST` | `/tags/{tag_uid}/books/{book_uid}` | Attach a tag to a book |
| `PUT` | `/tags/{tag_uid}` | Rename a tag |
| `DELETE` | `/tags/{tag_uid}` | Delete a tag |

</details>

Authenticated endpoints expect `Authorization: Bearer <access token>`. The frontend's API client attaches and refreshes tokens automatically.

## 🗂 Project layout

```
bookshelf-api/
├── backend/
│   ├── main.py               # ASGI entrypoint (uvicorn main:app)
│   ├── error.py              # domain exceptions + JSON error handlers
│   ├── requirements.txt
│   └── src/
│       ├── auth/             # routes, JWT utils, dependencies, schemas
│       ├── books/            # book CRUD + app settings (config.py)
│       ├── reviews/          # review routes and service
│       ├── tags/             # tag routes and service
│       ├── db/               # async engine, models, Redis blocklist
│       ├── mail.py           # fastapi-mail configuration
│       └── celery_tasks.py   # async email task
└── frontend/
    └── src/
        ├── lib/              # typed API client, auth context
        ├── components/       # navbar, book cards, forms, UI primitives
        └── app/              # books, profile, login, signup,
                              # verify/[token], password-reset-confirm/[token]
```

## 🧰 Tech stack

**Backend** · FastAPI · SQLModel (async SQLAlchemy) · Pydantic v2 · PostgreSQL (asyncpg) · Redis · Celery · PyJWT · passlib/bcrypt · fastapi-mail · itsdangerous

**Frontend** · Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4

---

<div align="center">

Built with FastAPI & Next.js — PRs and issues welcome.

</div>
