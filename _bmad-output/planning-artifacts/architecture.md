---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: "complete"
completedAt: "2026-03-29"
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/project-brief.md"
workflowType: "architecture"
project_name: "sdd-todo-app"
user_name: "Hamza"
date: "2026-03-29"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
5 core features covering the full task lifecycle: list (with active/completed ordering), create (with validation), edit (inline, active todos only), complete/uncomplete (toggle), and delete (immediate). All operations are synchronous CRUD — no real-time, streaming, or background processing requirements.

**Non-Functional Requirements:**
- Performance: API < 200ms; UI interactions feel instantaneous
- Responsiveness: 375px–1440px+; touch targets ≥ 44px
- Accessibility: WCAG AA minimum; keyboard navigation; ARIA labels
- Reliability: Data survives container restart via Docker volume mount
- Portability: Single `docker-compose up` boots full stack
- Security baseline: Input sanitisation, parameterised queries (no auth required)
- Error handling: Structured JSON errors server-side; non-crashing client-side recovery

**Scale & Complexity:**
- Primary domain: Full-stack web (Next.js App Router frontend + REST API backend + relational database)
- Complexity level: Low (by design — quality is the constraint, not scale)
- Estimated architectural components: 9
  (Next.js App Router, Server + Client Components, Express API server, Knex DB layer,
   4 REST route handlers, docker-compose orchestration)

### Technical Constraints & Dependencies

- Stack is fixed: React, Node.js/Express, SQLite via Knex, Docker
- No external service dependencies (no third-party APIs, no auth providers)
- SQLite is file-backed — Docker volume mount is critical path for persistence
- No environment-specific secrets required for v1 (no API keys, no credentials)
- Development mode must also work without Docker (local npm dev workflow)

### Cross-Cutting Concerns Identified

1. **Error handling** — Must be consistent across all 4 API endpoints and all 5 client-side operations
2. **Input validation** — Required both client-side (UX) and server-side (data integrity)
3. **Responsive layout** — All components must adapt from 375px to 1440px+
4. **Docker volume management** — Persistence contract between container lifecycle and SQLite file
5. **Extensibility seams** — `user_id` schema stub, stateless API, Knex abstraction layer

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web (Next.js App Router frontend + Express REST API backend) — separate packages in a monorepo, orchestrated by docker-compose. TypeScript across both layers. Next.js is used as a frontend framework only — Express owns all API routes.

### Starter Options Considered

| Candidate | Decision | Reason |
|-----------|----------|--------|
| create-react-app | ❌ Rejected | Deprecated since 2023 |
| Vite + React (react-ts) | ❌ Replaced | Next.js App Router provides stronger portfolio signal and built-in patterns |
| Next.js (API routes only, no Express) | ❌ Rejected | Separating API into Express is an explicit project goal |
| Next.js (App Router) + Express backend | ✅ Selected | Modern frontend framework with deliberate backend separation |
| express-generator | ❌ Rejected | JS-only, outdated structure |
| Manual Express + TypeScript | ✅ Selected for backend | Minimal, clean, full control |

### Selected Approach: Next.js App Router (frontend) + Manual Express (backend) Monorepo

**Rationale:**
Next.js App Router is the current industry standard for React applications, demonstrating knowledge of Server Components, the client/server rendering boundary, and modern routing patterns. Using it as a pure frontend framework (no API routes) while keeping Express as the dedicated backend shows deliberate architectural thinking — not just "use Next.js for everything." This combination is a strong portfolio differentiator.

**Important constraint:** Next.js API routes (`/app/api/`) are NOT used. All data operations go through the Express backend. This keeps the separation of concerns clean and the architecture explicit.

### Repository Structure

```
sdd-todo-app/
├── frontend/              ← Next.js 15 App Router + TypeScript + Tailwind
├── backend/               ← Express 5 + TypeScript + Knex + SQLite
├── docker-compose.yml
└── README.md
```

### Initialization Commands

**Frontend:**
```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

**Backend:**
```bash
mkdir backend && cd backend && npm init -y
npm install express knex better-sqlite3 cors helmet
npm install -D typescript ts-node-dev @types/express @types/node @types/cors @types/better-sqlite3
npx tsc --init
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
TypeScript across both frontend and backend. Node.js 22 LTS (Express 5 requires ≥ 18; Next.js 15 requires ≥ 18.18).

**Frontend Framework:**
Next.js 15 with App Router — React 19, Server Components by default, Client Components opt-in via `"use client"` directive. Built-in TypeScript, ESLint, and Tailwind CSS v4 configuration included.

**Server vs Client Component Strategy:**
- `app/page.tsx` — Server Component; fetches initial todo list server-side from Express API
- `components/TodoList.tsx` — Client Component (`"use client"`); owns all interactive state (edit mode, optimistic feedback)
- `components/TodoItem.tsx` — Client Component; handles checkbox, edit, delete interactions
- `components/AddTodo.tsx` — Client Component; owns form input state

This pattern demonstrates correct RSC boundary understanding: server renders the shell and initial data, client takes over for interactivity.

**Backend Runtime:**
Express 5 (stable) — async error handling built-in. `ts-node-dev` for hot reload in development; `tsc` compile for production container.

**Styling Solution:**
Tailwind CSS v4 — included in `create-next-app` output. No additional install required.

**Testing Framework:**
Vitest + React Testing Library (frontend) + Supertest (backend API integration tests).
Next.js 15 supports Vitest via `@vitejs/plugin-react`. Consistent tooling across both packages.

**Code Organisation:**
Frontend: App Router conventions (`app/`, `components/`, `lib/`).
Backend: layered architecture — `routes/`, `controllers/`, `services/`, `db/`.

**Development Experience:**
- Frontend: `next dev` with Fast Refresh on port 3000
- Backend: `ts-node-dev` with auto-restart on port 4000
- Both runnable independently without Docker for fast local iteration

**Note:** Project initialisation using these commands should be the first implementation story (Epic 0 / Story 0.1).

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- D2: Knex migrations for schema versioning
- D7: Global error handler middleware
- D9: TanStack Query for client-side server state management
- D-RSC: Server/Client Component boundary strategy

**Important Decisions (Shape Architecture):**
- D1: Integer PKs, D3: Zod validation, D10: Native fetch API service
- D11: Confirmed updates, D12: Multi-stage Docker builds

**Deferred Decisions (Post-v1):**
- API versioning (`/api/v1`) — revisit when breaking changes are needed
- Optimistic updates — add after v1 is stable
- OpenAPI/Swagger docs — add if API surface grows

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary Key | Auto-increment integer | Simple, performant, SQLite-native; UUIDs add complexity with no v1 benefit |
| Schema migrations | Knex migrations (`knex migrate:latest`) | Version-controlled schema; correct production pattern |
| Input validation | Zod | TypeScript-first runtime validation; schema inference eliminates type duplication |

**Schema — todos table:**
```sql
CREATE TABLE todos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT    NOT NULL CHECK(length(text) >= 1 AND length(text) <= 500),
  completed  BOOLEAN NOT NULL DEFAULT 0,
  user_id    INTEGER,           -- NULL in v1; reserved for future multi-user support
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authentication | None (v1) | Single-user, out of scope by design |
| CORS | `cors` npm package; `CORS_ORIGIN` env var | Configurable origin without hardcoding |
| Security headers | `helmet` middleware | One-line, zero-config; good hygiene signal on all routes |
| SQL injection | Knex parameterised queries | No raw string interpolation in any DB query |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Versioning | None (`/api/todos`) | 4 endpoints at this scale; add versioning when breaking changes arise |
| Error handling | Global error handler middleware | Express 5 propagates async errors automatically; one centralised handler |
| Error response shape | `{ "error": string, "statusCode": number }` | Consistent contract; easy to parse on client |
| API documentation | README only | 4 endpoints; inline examples sufficient |

**Global error handler pattern (Express 5):**
```typescript
// errors propagate automatically from async route handlers in Express 5
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = (err as any).statusCode ?? 500;
  res.status(statusCode).json({ error: err.message, statusCode });
});
```

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering strategy | Server Component page + Client Component interactive boundary | Demonstrates RSC correctly; fast initial render server-side |
| Server state | TanStack Query v5 | Handles loading/error/cache/invalidation automatically; industry standard |
| HTTP client | Native `fetch` in `lib/api.ts` service module | No extra dependency; demonstrates modern JS knowledge |
| UI updates | Confirmed (invalidate TanStack Query cache after mutation) | Simpler, easier to reason about; optimistic updates are a v2 enhancement |
| Component structure | Feature-based under `components/` | `TodoList` (Client), `TodoItem` (Client), `AddTodo` (Client), `page.tsx` (Server) |

**Server/Client Component boundary:**
```
app/page.tsx                    ← Server Component
  └── fetches initial todos from Express API (server-side)
  └── <TodoList initialTodos={todos} />

components/TodoList.tsx         ← "use client"
  └── TanStack Query owns client state after initial render
  └── <AddTodo />
  └── <TodoItem /> × N

components/TodoItem.tsx         ← "use client"
  └── inline edit state (useState)
  └── checkbox, edit, delete actions → TanStack Query mutations
```

**Environment variables:**
- `NEXT_PUBLIC_API_URL=http://localhost:4000` (client-accessible)
- Used in `lib/api.ts` for all fetch calls

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Docker builds | Multi-stage Dockerfiles | Smaller production images; demonstrates production-readiness |
| Environment config | `.env` per service; injected via `docker-compose.yml` | No secrets in v1; clean separation of config from code |
| Backend env vars | `PORT=4000`, `CORS_ORIGIN`, `DATABASE_PATH=/data/todos.db` | Minimal, explicit, documented |
| Frontend env vars | `NEXT_PUBLIC_API_URL=http://localhost:4000` | Single config point for API base URL |
| SQLite persistence | Docker named volume mounted at `/data/` in backend container | Survives `docker-compose restart`; volume name documented in compose file |

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo scaffold → Next.js init → Express init
2. Knex migration + SQLite schema (`todos` table)
3. Express routes + Zod validation + global error handler
4. Next.js Server Component page + TanStack Query setup
5. Client Components (TodoList, TodoItem, AddTodo)
6. Multi-stage Dockerfiles + docker-compose wiring
7. README + polish

**Cross-Component Dependencies:**
- Zod schemas live in `backend/src/schemas/` — types can be exported and shared with frontend if needed
- TanStack Query keys must match API endpoint paths for consistent cache invalidation (`['todos']`)
- `NEXT_PUBLIC_API_URL` in frontend must match backend container's exposed port in docker-compose
- Docker volume name in `docker-compose.yml` must match `DATABASE_PATH` env var in backend container

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

7 areas where AI agents could make different incompatible choices without explicit rules: boolean casting, API response shape, query key structure, boolean in DB, component/file naming, test location, and fetch call location.

### Naming Patterns

**Database Naming (snake_case):**
- Tables: lowercase plural — `todos`
- Columns: `snake_case` — `created_at`, `updated_at`, `user_id`
- Migrations: `YYYYMMDDHHMMSS_description.ts` — e.g. `20260329120000_create_todos.ts`

**API JSON Naming (camelCase):**
- All JSON response fields use camelCase — `createdAt`, `updatedAt`, `completed`
- Route params: `:id` (never `:todoId`, never `{id}`)
- Endpoints: plural resource nouns — `/api/todos`, `/api/todos/:id`

**Code Naming:**
- React components: `PascalCase.tsx` (`TodoItem.tsx`, `AddTodo.tsx`)
- Backend files: `camelCase.ts` (`todoRoutes.ts`, `todoService.ts`)
- Directories: `kebab-case`
- Interfaces/Types: `PascalCase` (`Todo`, `CreateTodoInput`, `UpdateTodoInput`)
- Functions/variables: `camelCase`
- True constants: `SCREAMING_SNAKE_CASE` (`MAX_TODO_LENGTH`)

### Structure Patterns

**Backend Layer Separation:**
- `routes/` — Express router + request parsing only. No business logic.
- `controllers/` — Zod validation + HTTP response shaping. Calls services.
- `services/` — All business logic + Knex queries. No Express types (`Request`/`Response`).
- `db/` — Knex config, migrations, seeds.

**Frontend Layer Separation:**
- `app/` — Next.js App Router pages/layouts (Server Components by default)
- `components/` — All React UI components (`"use client"` where interactive)
- `lib/api/` — All fetch calls to Express API. Never fetch directly from components.
- `lib/queryClient.ts` — TanStack Query client configuration

**Test File Location:** Co-located with source files.
- `TodoItem.tsx` → `TodoItem.test.tsx`
- `todoService.ts` → `todoService.test.ts`

### Format Patterns

**API Success Responses:** Direct data — no wrapper envelope.
```typescript
// ✅ res.json(todos)          — array response
// ✅ res.json(todo)           — single item response
// ✅ res.status(204).send()   — delete response (no body)
// ❌ res.json({ data: todos, success: true }) — never wrap
```

**API Error Responses:**
```typescript
{ "error": string, "statusCode": number }
```

**Date Format:** ISO 8601 strings in all API responses. Never Unix timestamps.

**SQLite Boolean Casting:** Always cast `0`/`1` to `false`/`true` in the service layer before returning. No raw `0`/`1` booleans ever reach the client.
```typescript
// ✅ Correct — transform in service layer
const todo = { ...row, completed: Boolean(row.completed) }
```

### Communication Patterns

**TanStack Query Keys:**
- Todo list: `['todos']`
- Single todo: `['todos', id]`
- After any mutation: `queryClient.invalidateQueries({ queryKey: ['todos'] })`

**State Management:** TanStack Query owns all server state. Local `useState` for UI-only state (edit mode, input value). No global client state store.

### Process Patterns

**Error Handling:**
- Backend: All async route errors propagate to global error handler middleware (Express 5 automatic)
- Frontend: TanStack Query `error` state drives error UI. No try/catch in components.
- User-facing messages: Plain English, non-technical (`"Failed to save task. Please try again."`)

**Loading States:**
- TanStack Query `isLoading` / `isPending` drives all loading UI
- Page-level loading: Next.js `loading.tsx` in `app/`
- Mutation loading: `isPending` from `useMutation` disables submit button during in-flight request

**Validation Timing:**
- Client-side: On submit only — not on every keystroke
- Server-side: Zod schema in controller on every request, always, regardless of client validation

### Enforcement Guidelines

**All agents implementing this project MUST:**
- Transform SQLite `0`/`1` booleans to `true`/`false` in the service layer before returning
- Use `lib/api/todos.ts` for all API calls from the frontend — never raw `fetch` in components
- Use `['todos']` as the root TanStack Query key for all todo-related queries
- Return direct data (no envelope) from all success API responses
- Place all Zod validation in controllers — never in routes or services
- Co-locate test files with source files
- Use `"use client"` directive on any component that uses hooks or event handlers
- Never use Express types (`Request`, `Response`) in the service layer

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
sdd-todo-app/
├── docker-compose.yml              ← Full-stack startup (ports 3000 + 4000)
├── .gitignore
├── README.md
│
├── frontend/                       ← Next.js 15 App Router
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── vitest.config.ts
│   ├── .env.local                  ← NEXT_PUBLIC_API_URL=http://localhost:4000
│   ├── .env.example
│   ├── Dockerfile                  ← Multi-stage: build + runtime
│   │
│   ├── app/                        ← App Router root
│   │   ├── globals.css
│   │   ├── layout.tsx              ← Root layout — TanStack Query Provider
│   │   ├── loading.tsx             ← Page-level loading state (F1)
│   │   ├── error.tsx               ← Page-level error boundary (Journey 6)
│   │   └── page.tsx                ← Server Component — initial todo fetch (F1)
│   │
│   ├── components/
│   │   ├── AddTodo.tsx             ← "use client" — create form (F2)
│   │   ├── AddTodo.test.tsx
│   │   ├── TodoList.tsx            ← "use client" — list + TanStack Query (F1)
│   │   ├── TodoList.test.tsx
│   │   ├── TodoItem.tsx            ← "use client" — item: edit/complete/delete (F3,F4,F5)
│   │   ├── TodoItem.test.tsx
│   │   ├── ErrorBanner.tsx         ← "use client" — API error display (Journey 6)
│   │   └── ErrorBanner.test.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   └── todos.ts            ← All fetch calls to Express API (single source of truth)
│   │   └── queryClient.ts          ← TanStack Query client config + Provider
│   │
│   ├── types/
│   │   └── todo.ts                 ← Shared TypeScript interfaces (Todo, CreateTodoInput, etc.)
│   │
│   └── public/
│       └── favicon.ico
│
└── backend/                        ← Express 5 + TypeScript
    ├── package.json
    ├── tsconfig.json
    ├── knexfile.ts                 ← Knex config (dev + production profiles)
    ├── .env                        ← PORT, CORS_ORIGIN, DATABASE_PATH
    ├── .env.example
    ├── Dockerfile                  ← Multi-stage: build + runtime
    │
    ├── src/
    │   ├── index.ts                ← Entry point — starts server, runs migrations
    │   ├── app.ts                  ← Express app — middleware, routes, error handler
    │   │
    │   ├── routes/
    │   │   └── todoRoutes.ts       ← Express router: GET/POST /api/todos, PUT/DELETE /api/todos/:id
    │   │
    │   ├── controllers/
    │   │   └── todoController.ts   ← Zod validation + res.json() shaping for all 4 endpoints
    │   │
    │   ├── services/
    │   │   ├── todoService.ts      ← Knex queries + boolean casting + business logic
    │   │   └── todoService.test.ts ← Supertest integration tests for all endpoints
    │   │
    │   ├── schemas/
    │   │   └── todoSchemas.ts      ← Zod schemas: CreateTodoSchema, UpdateTodoSchema
    │   │
    │   ├── db/
    │   │   ├── knex.ts             ← Knex singleton instance
    │   │   └── migrations/
    │   │       └── 20260329120000_create_todos.ts ← todos table schema
    │   │
    │   ├── middleware/
    │   │   └── errorHandler.ts     ← Global error handler (4-arg Express middleware)
    │   │
    │   └── types/
    │       └── todo.ts             ← TypeScript interfaces for DB rows and API shapes
    │
    └── data/                       ← SQLite database file directory
        └── .gitkeep                ← Gitignored; Docker volume mounted here
```

### Requirements to Structure Mapping

| Requirement | Frontend Files | Backend Files |
|-------------|---------------|---------------|
| F1 — List todos | `app/page.tsx`, `components/TodoList.tsx`, `lib/api/todos.ts` | `GET /api/todos` → `todoController` → `todoService` |
| F2 — Create todo | `components/AddTodo.tsx`, `lib/api/todos.ts` | `POST /api/todos` → Zod `CreateTodoSchema` → `todoService.create()` |
| F3 — Edit todo | `components/TodoItem.tsx`, `lib/api/todos.ts` | `PUT /api/todos/:id` → Zod `UpdateTodoSchema` → `todoService.update()` |
| F4 — Complete/Uncomplete | `components/TodoItem.tsx`, `lib/api/todos.ts` | `PUT /api/todos/:id` (same endpoint, `completed` field) |
| F5 — Delete todo | `components/TodoItem.tsx`, `lib/api/todos.ts` | `DELETE /api/todos/:id` → `todoService.delete()` |
| Error states | `components/ErrorBanner.tsx`, `app/error.tsx` | `middleware/errorHandler.ts` |
| Loading states | `app/loading.tsx`, TanStack Query `isLoading` | — |

### Architectural Boundaries

**API Boundary:**
- All client → server communication goes through `frontend/lib/api/todos.ts`
- Base URL sourced from `NEXT_PUBLIC_API_URL` env var only
- No Next.js API routes (`/app/api/`) — Express owns all endpoints

**Component Boundary:**
- Server Components: `app/page.tsx`, `app/layout.tsx`, `app/loading.tsx`, `app/error.tsx`
- Client Components: everything under `components/` (all use hooks or event handlers)
- TanStack Query Provider must wrap the component tree in `app/layout.tsx`

**Service Boundary:**
- Only `backend/src/services/todoService.ts` imports Knex
- Controllers call services; routes call controllers; nothing skips layers

**Data Boundary:**
- SQLite file lives at `DATABASE_PATH` (Docker volume `/data/todos.db`)
- Migrations run automatically on `src/index.ts` startup via `knex.migrate.latest()`
- `data/` directory is gitignored; `.gitkeep` preserves directory in repo

### Data Flow

```
Browser
  └─ app/page.tsx (Server Component)
       └─ fetch(NEXT_PUBLIC_API_URL + '/api/todos')
            └─ todoRoutes → todoController → todoService → Knex → SQLite
            └─ returns Todo[] → passed as initialTodos to TodoList

  └─ TodoList.tsx (Client Component, "use client")
       └─ useQuery(['todos'], initialData: initialTodos)  ← hydrated, no flash
       └─ useMutation → lib/api/todos.ts → POST/PUT/DELETE /api/todos/:id
       └─ onSuccess: invalidateQueries(['todos']) → background refetch
```

### Integration Points

**docker-compose service communication:**
- Frontend container → Backend container via Docker internal network
- `NEXT_PUBLIC_API_URL` set to backend service name in compose for production
- In development: both run locally, frontend at `:3000`, backend at `:4000`

**SQLite volume mount:**
```yaml
volumes:
  - todo-data:/data
# backend DATABASE_PATH=/data/todos.db
```

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are mutually compatible:
- Next.js 15 (React 19) + TanStack Query v5 ✅
- Express 5 requires Node.js ≥ 18; using Node.js 22 LTS ✅
- Knex + better-sqlite3 + TypeScript ✅
- Tailwind CSS v4 included in create-next-app ✅
- Vitest compatible with Next.js 15 via `@vitejs/plugin-react` ✅
- Zod TypeScript inference compatible with strict tsconfig ✅

**Pattern Consistency:**
- snake_case DB columns → camelCase API JSON → camelCase TypeScript: consistent transform at service layer ✅
- Backend layer separation (routes → controllers → services → db): no circular dependencies ✅
- Server Component initial fetch → Client Component TanStack Query hydration: clean RSC boundary ✅
- Zod validation in controllers only, Knex in services only: no layer leakage ✅

**Structure Alignment:**
All 5 functional requirements mapped to specific files. All 6 UI states have designated components. Project structure supports chosen patterns with no orphaned directories.

### Requirements Coverage Validation ✅

**Functional Requirements:**

| FR | Coverage | Files |
|----|----------|-------|
| F1 — List todos | ✅ Full | `page.tsx`, `TodoList.tsx`, `GET /api/todos` |
| F2 — Create todo | ✅ Full | `AddTodo.tsx`, `POST /api/todos`, `CreateTodoSchema` |
| F3 — Edit todo | ✅ Full | `TodoItem.tsx` (inline edit), `PUT /api/todos/:id`, `UpdateTodoSchema` |
| F4 — Complete/Uncomplete | ✅ Full | `TodoItem.tsx` (checkbox), `PUT /api/todos/:id` |
| F5 — Delete todo | ✅ Full | `TodoItem.tsx` (delete btn), `DELETE /api/todos/:id` |

**UI State Coverage:**

| State | Coverage | Implementation |
|-------|----------|----------------|
| Loading | ✅ | `app/loading.tsx` + TanStack Query `isLoading` |
| Empty (no todos) | ✅ | Conditional render in `TodoList.tsx` |
| Empty (all completed) | ✅ | Conditional render in `TodoList.tsx` |
| API Error | ✅ | `ErrorBanner.tsx` + TanStack Query `error` state |
| Validation Error | ✅ | Inline in `AddTodo.tsx` on empty submit |
| Page Error Boundary | ✅ | `app/error.tsx` (Next.js App Router convention) |

**Non-Functional Requirements:**

| NFR | Coverage | How |
|-----|----------|-----|
| Performance < 200ms | ✅ | SQLite local, Express minimal, no N+1 queries |
| Responsiveness 375px–1440px | ✅ | Tailwind CSS responsive utilities |
| Accessibility WCAG AA | ✅ | Tailwind + semantic HTML; ARIA labels in components |
| Reliability (persist across restart) | ✅ | Docker named volume at `DATABASE_PATH` |
| Portability (single command) | ✅ | `docker-compose.yml` at root |
| Error handling | ✅ | Global handler (backend) + TanStack Query error state (frontend) |
| Security baseline | ✅ | Zod validation + Knex parameterised queries + helmet |

### Implementation Readiness Validation ✅

**Decision Completeness:** All 13 core decisions documented with rationale. Technology versions specified. No open questions remain.

**Structure Completeness:** All files and directories defined. Every requirement mapped to at least one file. Integration points, data flow, and Docker volumes fully specified.

**Pattern Completeness:** 7 conflict points addressed. Naming, structure, format, communication, and process patterns all documented with positive examples and anti-patterns.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gap — Native Module Docker Handling:**
`better-sqlite3` is a native Node.js C++ addon. Multi-stage Docker builds must use the **same Node.js base image** in both `build` and `runtime` stages to ensure binary compatibility. Recommended pattern:

```dockerfile
# backend/Dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

Using `node:22-alpine` for **both** stages ensures the native binary compiled in `build` runs without recompilation in `runtime`.

**Minor Gap — app/error.tsx interface:**
Next.js App Router requires `error.tsx` to be a Client Component with a specific interface:
```typescript
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) { ... }
```
Implementation agents must follow this exact signature.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analysed
- [x] Scale and complexity assessed (Low — by design)
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped (7 identified)

**✅ Architectural Decisions**
- [x] 13 core decisions documented with rationale
- [x] Technology stack fully specified with versions
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (layered backend, RSC boundary)
- [x] Format patterns specified (response shape, boolean casting, dates)
- [x] Process patterns documented (error handling, loading, validation timing)
- [x] 7 enforcement rules for AI agents

**✅ Project Structure**
- [x] Complete directory tree with all files
- [x] Component boundaries established (Server vs Client)
- [x] Integration points mapped (frontend → backend → DB)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Clean separation of concerns: Next.js frontend / Express backend / SQLite — no coupling
- RSC boundary is explicit and purposeful — demonstrates real Next.js 15 knowledge
- Consistent data transformation contract (snake_case DB → camelCase API) prevents silent bugs
- 7 enforcement rules give AI agents unambiguous guidance for conflict-prone decisions
- Docker native module handling documented proactively — prevents a common deployment failure

**Areas for Future Enhancement:**
- Optimistic updates in TanStack Query mutations (post-v1)
- Shared Zod schema package between frontend and backend (eliminates type duplication)
- API versioning (`/api/v1/`) when breaking changes are introduced
- OpenAPI/Swagger documentation if API surface grows
- Postgres migration path via Knex driver swap

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Consult Requirements → Structure Mapping before creating any new file
- Never skip a layer (routes → controllers → services → db)
- Always apply the boolean casting rule in `todoService.ts`
- Use the exact `error.tsx` Client Component signature for Next.js App Router

**First Implementation Priority:**
```bash
# Step 1: Scaffold monorepo
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
mkdir backend && cd backend && npm init -y

# Step 2: Install backend dependencies
npm install express knex better-sqlite3 cors helmet
npm install -D typescript ts-node-dev @types/express @types/node @types/cors @types/better-sqlite3
```
