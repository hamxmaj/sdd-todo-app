# sdd-todo-app

A full-stack Todo application built as a portfolio-quality project demonstrating modern React, Node.js, and TypeScript patterns.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript |
| Backend | Express 5, TypeScript, Knex, better-sqlite3 |
| Database | SQLite (file-backed, Docker volume) |
| Testing | Vitest + React Testing Library (unit), Playwright (E2E) |
| Infra | Docker + docker-compose |

## Prerequisites

- Node.js 22 LTS
- Docker & docker-compose (for containerised run)
- npm

## Quickstart (Docker)

```bash
docker-compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Local Dev (without Docker)

```bash
# Install all dependencies
npm run install:all

# Terminal 1 — backend (port 4000)
npm run dev:backend

# Terminal 2 — frontend (port 3000)
npm run dev:frontend
```

## Running Tests

```bash
# Unit tests (frontend + backend)
npm test

# Frontend unit tests only
npm run test:frontend

# Backend unit tests only
npm run test:backend

# E2E tests (requires running app)
npm run test:e2e
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `DATABASE_PATH` | `./data/todos.db` | SQLite file path |
| `NODE_ENV` | `development` | Runtime environment |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Express API base URL |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/todos` | List all todos (active first, then completed) |
| `POST` | `/api/todos` | Create a new todo |
| `PUT` | `/api/todos/:id` | Update todo text or completion status |
| `DELETE` | `/api/todos/:id` | Delete a todo (returns 204) |
| `GET` | `/health` | Health check |

## Project Structure

```
sdd-todo-app/
├── frontend/          Next.js App Router
├── backend/           Express 5 API
├── e2e/               Playwright E2E tests
├── docker-compose.yml
└── README.md
```
