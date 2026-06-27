# OfferFlow — AI Interview Tracker

A full-stack job application tracker built with React, Node.js, Express, TypeScript, and PostgreSQL. Track companies, roles, interview stages, and notes in one place.

## Features

- **JWT authentication** — signup, login, protected routes
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
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing tokens |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `CORS_ORIGIN` | Frontend URL (default: `http://localhost:5173`) |

Example `DATABASE_URL`:

```
postgresql://postgres:password@localhost:5432/offerflow
```

Run the database migration:

```bash
npm run db:setup
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
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (protected) |

### Applications (protected — requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications/dashboard` | Dashboard stats |
| GET | `/api/applications` | List applications (`?company=&role=&status=`) |
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
