# OfferFlow — AI Interview Tracker

[![CI](https://github.com/mohit716/OfferFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/mohit716/OfferFlow/actions/workflows/ci.yml)

A full-stack job application tracker built with React, Node.js, Express, TypeScript, and PostgreSQL. Track companies, roles, interview stages, and notes in one place.

## Features

- **JWT authentication** — signup, login, protected routes, rotating refresh tokens (httpOnly cookie) with server-side revocation
- **CRUD applications** — add, edit, delete job applications
- **Application fields** — company, role, location, salary, job link, status, notes
- **Status pipeline** — Applied, OA, Interview, Offer, Rejected
- **Search & filter** — by company, role, or status
- **Dashboard** — total applications and counts by status

## Project Structure

```
OfferFlow/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & app config
│   │   ├── db/             # SQL schema
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── scripts/        # DB setup script
│   │   └── index.ts        # Server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # UI components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Route pages
│   │   └── types/          # TypeScript types
│   └── package.json
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 14+

## Setup

### 1. Create the database

```bash
psql -U postgres
CREATE DATABASE offerflow;
\q
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default: `5000`) |
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `JWT_SECRET` | Secret key for signing access tokens (required) |
| `ACCESS_TOKEN_TTL` | Access token lifetime (default: `15m`) |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifetime in days (default: `30`) |
| `CORS_ORIGIN` | Frontend URL (default: `http://localhost:5173`) |

> The server fails fast on startup if `DATABASE_URL` or `JWT_SECRET` is missing.

Example `DATABASE_URL`:

```
postgresql://postgres:password@localhost:5432/offerflow
```

Run the database migrations:

```bash
npm run db:migrate
```

Start the API server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

## API Endpoints

### Auth (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account (returns access token, sets refresh cookie) |
| POST | `/api/auth/login` | Login (returns access token, sets refresh cookie) |
| POST | `/api/auth/refresh` | Exchange refresh cookie for a new access token |
| POST | `/api/auth/logout` | Revoke the refresh token |
| GET | `/api/auth/me` | Get current user (protected) |

### Applications (protected — requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications/dashboard` | Dashboard stats |
| GET | `/api/applications` | List applications (`?company=&role=&status=&limit=&offset=`) |
| GET | `/api/applications/:id` | Get one application |
| POST | `/api/applications` | Create application |
| PUT | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |

## Database Schema

**users**
- `id`, `email`, `password_hash`, `name`, `created_at`

**applications**
- `id`, `user_id`, `company`, `role`, `location`, `salary`, `job_link`, `status`, `notes`, `created_at`, `updated_at`

**status enum:** `Applied`, `OA`, `Interview`, `Offer`, `Rejected`

## Testing

The backend has an integration test suite (Vitest + Supertest) covering auth
flows and per-user data isolation. It runs against a dedicated
`<db>_test` database that is created and migrated automatically.

```bash
cd backend
npm test          # run once
npm run test:watch
```

CI (GitHub Actions) runs the backend tests against a Postgres service and
builds the frontend on every push and pull request.

## Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

Set `VITE_API_URL` in `frontend/.env` to your production API URL before building the frontend.

## License

MIT
