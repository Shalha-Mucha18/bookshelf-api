# 📚 Bookly — Bookshelf App

A full-stack book catalogue: track the books you own, rate and review them, and organise your shelf with tags. Email-verified accounts, JWT authentication, and asynchronous email delivery via Celery.

```
bookshelf-api/
├── backend/     FastAPI + PostgreSQL + Redis + Celery
└── frontend/    Next.js (App Router) + TypeScript + Tailwind CSS
```

## Features

- **Accounts** — sign-up with email verification, JWT login (access + refresh tokens), logout with server-side token revocation, password reset by email
- **Books** — add, edit, delete and browse books with search and generated cover art
- **Reviews** — 1–5 star ratings with text reviews, per-book averages
- **Tags** — create tags (admin) and attach them to books
- **Email** — verification and password-reset emails sent asynchronously through a Celery worker over Gmail SMTP
- **Roles** — `user` / `admin`; unverified accounts are blocked from protected endpoints

## Tech stack

| Layer | Technology |
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
