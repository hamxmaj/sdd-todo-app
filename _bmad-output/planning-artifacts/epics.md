---
stepsCompleted: [1, 2, 3, 4]
status: "complete"
completedAt: "2026-03-29"
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/project-brief.md"
---

# sdd-todo-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for sdd-todo-app, decomposing the requirements from the PRD and Architecture into implementable stories.

---

## Requirements Inventory

### Functional Requirements

FR1: The system shall display all todos on page load, with active todos listed above completed todos, and within each group ordered by creation date descending (newest first).

FR2: The system shall allow users to create a new todo by entering text (1–500 characters) and pressing Enter or clicking the submit button; the input shall be trimmed, rejected if blank, and cleared and refocused on success.

FR3: The system shall allow users to edit the text of an active (non-completed) todo via inline editing — triggered by an edit button or double-click — confirming with Enter or blur, and cancelling with Escape.

FR4: The system shall allow users to toggle a todo between active and completed states via a checkbox; completed todos shall be visually distinguished (strikethrough + reduced opacity) and displayed in a separate section below active todos.

FR5: The system shall allow users to delete a todo immediately via a delete button with no confirmation dialog.

FR6: The system shall display a loading state while todos are being fetched from the API.

FR7: The system shall display a friendly empty state message ("No tasks yet — add one above") when no todos exist, and an "All done! Great work." message when all todos are completed.

FR8: The system shall display a non-blocking error banner when an API call fails, without clearing the existing visible todo list; the user can retry the failed action.

FR9: The system shall display an inline validation error message when a user attempts to submit an empty todo.

### NonFunctional Requirements

NFR1: All API responses shall complete in under 200ms under normal local load conditions.

NFR2: All UI interactions (create, edit, complete, delete) shall feel instantaneous to the user.

NFR3: The UI layout shall adapt correctly from 375px (mobile) to 1440px+ (desktop); all touch targets shall be at least 44px.

NFR4: The application shall meet WCAG AA accessibility standards — keyboard navigable, ARIA labels on all interactive elements, sufficient colour contrast.

NFR5: All todo data shall persist across browser refreshes and Docker container restarts.

NFR6: The full stack shall start with a single `docker-compose up` command with no manual environment setup.

NFR7: All API errors shall return structured JSON `{ "error": string, "statusCode": number }`; the client shall handle all 4xx/5xx responses without crashing.

NFR8: All user input shall be sanitised server-side; all database queries shall use parameterised statements to prevent SQL injection.

NFR9: The codebase shall have clear structure, consistent naming, no dead code, and a working README with setup instructions.

### Additional Requirements

From Architecture — technical requirements that affect implementation:

AR1: Project shall be structured as a monorepo with `frontend/` (Next.js 15 App Router) and `backend/` (Express 5 + TypeScript) packages, plus a root `docker-compose.yml`.

AR2: The backend database schema shall be managed via Knex migrations (`knex migrate:latest`) run automatically on server startup.

AR3: The `todos` table shall include: `id` (INTEGER PK AUTOINCREMENT), `text` (TEXT NOT NULL, 1–500 chars), `completed` (BOOLEAN DEFAULT 0), `user_id` (INTEGER NULL — reserved for future), `created_at` (DATETIME), `updated_at` (DATETIME).

AR4: All input validation on the backend shall use Zod schemas defined in `backend/src/schemas/todoSchemas.ts` and applied in controllers only.

AR5: Express 5 global error handler middleware shall be the single point of error response formatting for all 4 API endpoints.

AR6: The `app/page.tsx` Server Component shall fetch the initial todo list server-side from the Express API and pass it to `TodoList.tsx` as `initialTodos`. TanStack Query shall hydrate from this initial data on the client.

AR7: All interactive components (TodoList, TodoItem, AddTodo, ErrorBanner) shall be Client Components using the `"use client"` directive.

AR8: All API calls from the frontend shall be made exclusively through `frontend/lib/api/todos.ts` — no direct `fetch` calls from components.

AR9: SQLite database file shall be stored on a named Docker volume mounted at `/data/todos.db` in the backend container to ensure persistence across container restarts.

AR10: Both frontend and backend Dockerfiles shall use multi-stage builds with `node:22-alpine` for **both** build and runtime stages to ensure `better-sqlite3` native binary compatibility.

AR11: `helmet` middleware shall be applied to all Express routes for security header management.

AR12: CORS shall be configured via the `cors` npm package with the allowed origin sourced from the `CORS_ORIGIN` environment variable.

AR13: The `app/error.tsx` file must be a Client Component implementing the exact Next.js App Router error boundary interface with `error` and `reset` props.

### UX Design Requirements

No UX Design document present for this project. UI/UX patterns are derived from PRD user journeys and architecture component definitions.

### FR Coverage Map

| Requirement | Epic | Summary |
|-------------|------|---------|
| FR1 | Epic 1 | List todos with active/completed ordering |
| FR2 | Epic 1 | Create todo with validation and refocus |
| FR3 | Epic 3 | Inline edit of active todos |
| FR4 | Epic 2 | Complete/Uncomplete checkbox toggle |
| FR5 | Epic 2 | Delete todo immediately |
| FR6 | Epic 1 | Loading state while fetching |
| FR7 | Epic 2 | Empty states (no todos / all done) |
| FR8 | Epic 3 | Non-blocking API error banner |
| FR9 | Epic 2 | Inline validation error on empty submit |
| NFR1–NFR9 | Epic 4 | Performance, accessibility, deployment, testing |
| AR1–AR8, AR11–AR12 | Epic 1 | Monorepo scaffold, DB, API, middleware setup |
| AR9–AR10 | Epic 4 | Docker volumes + multi-stage builds |
| AR13 | Epic 3 | `error.tsx` App Router interface |

---

## Epic List

### Epic 1: View & Create Tasks
The full stack is running. A user can open the app, see their todo list, and add new tasks. Covers all foundation infrastructure because none of it delivers value without the ability to see and create tasks.
**FRs covered:** FR1, FR2, FR6, AR1–AR8, AR11–AR12

### Epic 2: Complete & Delete Tasks
A user can manage the full task lifecycle — check off completed tasks, watch them move to the bottom section, delete tasks no longer needed, and see helpful empty states.
**FRs covered:** FR4, FR5, FR7, FR9

### Epic 3: Edit Tasks & Error Resilience
A user can refine any active task by editing its text inline, and the app handles API failures gracefully without disrupting the experience.
**FRs covered:** FR3, FR8, AR13

### Epic 4: Production-Ready & Deployable
The app is tested, documented, and deployable with a single `docker-compose up` command. A developer or interviewer can clone, run, and evaluate it with full confidence.
**FRs covered:** NFR1–NFR9, AR9–AR10

---

## Epic 1: View & Create Tasks

Users can open the app, see their todo list, and add new tasks. Covers all foundation infrastructure — monorepo, database, API, and frontend — since none of it delivers value without the ability to see and create tasks.

### Story 1.1: Monorepo & Backend App Scaffold

As a developer,
I want the monorepo scaffolded with both Next.js and Express packages initialised,
So that both services run independently and the project structure matches the architecture document.

**Acceptance Criteria:**

**Given** the repository is freshly cloned
**When** `npm install` is run in both `frontend/` and `backend/`
**Then** both packages install without errors

**Given** the backend is started with `ts-node-dev`
**When** a request is made to `GET /health`
**Then** the server responds `200 OK` with `{ "status": "ok" }`
**And** `helmet` and `cors` middleware are active on all routes

**Given** the frontend is started with `next dev`
**When** the browser navigates to `http://localhost:3000`
**Then** the Next.js default page loads without errors

**And** the project structure matches: `frontend/` (Next.js App Router), `backend/src/` (routes, controllers, services, db, middleware, schemas, types), and a root `.gitignore`

---

### Story 1.2: Database Schema & Migrations

As a developer,
I want the todos table created via a Knex migration,
So that the backend has a persistent, version-controlled data store for todo items.

**Acceptance Criteria:**

**Given** the backend environment has `DATABASE_PATH` set
**When** `knex migrate:latest` is run (or the server starts)
**Then** the `todos` table is created with columns: `id` (INTEGER PK AUTOINCREMENT), `text` (TEXT NOT NULL), `completed` (INTEGER DEFAULT 0), `user_id` (INTEGER NULL), `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP), `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

**Given** the migration has already run
**When** `knex migrate:latest` is run again
**Then** it completes with no errors and no duplicate table creation

**Given** the server starts
**When** the database file does not yet exist
**Then** the SQLite file is created at `DATABASE_PATH` and migrations run automatically

**And** the migration file is named following the `YYYYMMDDHHMMSS_create_todos.ts` convention

---

### Story 1.3: Todo API — Read & Create Endpoints

As a developer,
I want `GET /api/todos` and `POST /api/todos` endpoints,
So that the frontend can fetch all todos and create new ones via the REST API.

**Acceptance Criteria:**

**Given** todos exist in the database
**When** `GET /api/todos` is called
**Then** it returns `200` with a JSON array ordered: active todos first (by `created_at` DESC), then completed todos (by `created_at` DESC)
**And** each todo has camelCase fields: `id`, `text`, `completed` (boolean — not 0/1), `createdAt`, `updatedAt`

**Given** no todos exist in the database
**When** `GET /api/todos` is called
**Then** it returns `200` with an empty array `[]`

**Given** a valid request body `{ "text": "Buy milk" }`
**When** `POST /api/todos` is called
**Then** it returns `201` with the newly created todo object with `completed: false`, a generated `id`, and timestamps

**Given** a request body with blank text `{ "text": "   " }`
**When** `POST /api/todos` is called
**Then** it returns `400` with `{ "error": "Text is required", "statusCode": 400 }`

**Given** a request body with text exceeding 500 characters
**When** `POST /api/todos` is called
**Then** it returns `400` with a validation error response

**And** Zod validation is applied in `todoController.ts` using `CreateTodoSchema`; the service layer contains no validation logic

---

### Story 1.4: Todo List Page

As a user,
I want to see my todo list when I open the app,
So that I can immediately view all my tasks without any extra steps.

**Acceptance Criteria:**

**Given** todos exist in the database
**When** the user navigates to `http://localhost:3000`
**Then** the page renders the todo list with active todos above completed todos
**And** the initial data is fetched server-side (no loading flash on first render)

**Given** the page has loaded
**When** the browser inspects the server-rendered HTML
**Then** the todo list content is present in the HTML (confirms Server Component fetch)

**Given** the page is loading data
**When** the fetch is in progress
**Then** `app/loading.tsx` renders a loading indicator

**And** `TodoList.tsx` is a Client Component (`"use client"`) hydrated from `initialTodos` passed by `page.tsx`
**And** TanStack Query is configured in `app/layout.tsx` with a `QueryClientProvider`
**And** all API calls go through `frontend/lib/api/todos.ts` — no direct `fetch` in components

---

### Story 1.5: Add Todo Form

As a user,
I want to type a task and press Enter to add it to my list,
So that I can quickly capture new tasks without leaving the keyboard.

**Acceptance Criteria:**

**Given** the user types a task description and presses Enter (or clicks the add button)
**When** the submission is successful
**Then** the new todo appears at the top of the active todos list
**And** the input field is cleared and refocused

**Given** the user submits text with leading/trailing whitespace
**When** the form is submitted
**Then** the saved todo text is trimmed (e.g. `"  Buy milk  "` → `"Buy milk"`)

**Given** the user submits an empty or whitespace-only input
**When** the form is submitted
**Then** an inline validation message appears: "Task can't be empty"
**And** no API call is made and the input remains focused

**Given** the add todo request is in-flight
**When** the mutation is pending
**Then** the submit button is disabled and shows a loading state

**And** `AddTodo.tsx` is a Client Component using `useMutation` from TanStack Query
**And** on success, `queryClient.invalidateQueries({ queryKey: ['todos'] })` is called

---

## Epic 2: Complete & Delete Tasks

Users can manage the full task lifecycle — check off completed tasks, watch them move to the completed section, delete tasks no longer needed, and see helpful empty states.

### Story 2.1: Todo API — Update & Delete Endpoints

As a developer,
I want `PUT /api/todos/:id` and `DELETE /api/todos/:id` endpoints,
So that the frontend can update todo text/completion status and permanently remove todos.

**Acceptance Criteria:**

**Given** a todo with `id: 1` exists
**When** `PUT /api/todos/1` is called with `{ "completed": true }`
**Then** it returns `200` with the updated todo showing `completed: true` and a new `updatedAt`

**Given** a todo with `id: 1` exists
**When** `PUT /api/todos/1` is called with `{ "text": "Updated text" }`
**Then** it returns `200` with the updated todo showing the new text

**Given** a non-existent todo id
**When** `PUT /api/todos/999` is called
**Then** it returns `404` with `{ "error": "Todo not found", "statusCode": 404 }`

**Given** a todo with `id: 1` exists
**When** `DELETE /api/todos/1` is called
**Then** it returns `204` with no response body and the todo no longer exists in the database

**Given** a non-existent todo id
**When** `DELETE /api/todos/999` is called
**Then** it returns `404` with `{ "error": "Todo not found", "statusCode": 404 }`

**And** Zod `UpdateTodoSchema` (with optional `text` and optional `completed` fields) is applied in `todoController.ts`

---

### Story 2.2: Complete & Uncomplete Todo

As a user,
I want to check off a task as complete and uncheck it if needed,
So that I can track which tasks are done and keep my list organised.

**Acceptance Criteria:**

**Given** an active todo in the list
**When** the user clicks its checkbox
**Then** the todo moves to the completed section at the bottom of the list
**And** the todo text is visually struck through with reduced opacity

**Given** a completed todo in the list
**When** the user clicks its checkbox again
**Then** the todo moves back to the active section and the strikethrough and opacity are removed

**Given** the completion toggle is in-flight
**When** the mutation is pending
**Then** the checkbox is disabled to prevent double-toggling

**And** the mutation calls `PUT /api/todos/:id` with `{ "completed": boolean }` via `lib/api/todos.ts`
**And** on success, `queryClient.invalidateQueries({ queryKey: ['todos'] })` is called

---

### Story 2.3: Delete Todo

As a user,
I want to delete a task with one click,
So that I can remove tasks I no longer need without any friction.

**Acceptance Criteria:**

**Given** a todo in the list (active or completed)
**When** the user clicks the delete button
**Then** the todo is immediately removed from the list with no confirmation dialog

**Given** the delete is in-flight
**When** the mutation is pending
**Then** the delete button is disabled

**Given** the delete request fails
**When** the API returns an error
**Then** the todo remains in the list and an error state is surfaced via TanStack Query

**And** on desktop the delete button is visible on hover; on mobile it is always visible
**And** the mutation calls `DELETE /api/todos/:id` via `lib/api/todos.ts`
**And** on success, `queryClient.invalidateQueries({ queryKey: ['todos'] })` is called

---

### Story 2.4: Empty States

As a user,
I want to see a helpful message when my list is empty or all tasks are done,
So that the app feels complete and intentional rather than broken.

**Acceptance Criteria:**

**Given** no todos exist in the database
**When** the todo list renders
**Then** the message "No tasks yet — add one above" is displayed in place of the list

**Given** all todos are completed and none are active
**When** the todo list renders
**Then** the message "All done! Great work." is displayed below the completed section

**Given** both active and completed todos exist
**When** the todo list renders
**Then** neither empty state message is shown

**And** empty state messages are rendered inside `TodoList.tsx` as conditional JSX
**And** the messages are visually distinct from todo items (muted colour, centred)

---

## Epic 3: Edit Tasks & Error Resilience

Users can refine any active task by editing its text inline, and the app handles API failures gracefully without disrupting the experience.

### Story 3.1: Inline Task Editing

As a user,
I want to edit the text of an active task inline,
So that I can correct or refine a task without deleting and recreating it.

**Acceptance Criteria:**

**Given** an active (non-completed) todo in the list
**When** the user clicks the edit button or double-clicks the todo text
**Then** the todo text is replaced by an editable input pre-filled with the current text

**Given** the user is in edit mode, modifies the text, then presses Enter or clicks away (blur)
**When** the new text is non-empty after trimming
**Then** the updated text is saved via `PUT /api/todos/:id` and displayed immediately

**Given** the user is in edit mode and presses Escape
**When** Escape is pressed
**Then** the edit is cancelled and the original text is restored with no API call made

**Given** the user clears all text and confirms (Enter or blur)
**When** the submitted text is empty after trimming
**Then** the edit is cancelled and the original text is restored (no API call, no error shown)

**Given** a completed todo in the list
**When** the user inspects the todo item
**Then** no edit button or double-click edit trigger is available

**And** edit mode state is managed with local `useState` inside `TodoItem.tsx`
**And** `TodoItem.tsx` is a `"use client"` component

---

### Story 3.2: API Error Handling & Error Boundaries

As a user,
I want to see a clear, non-disruptive message when something goes wrong,
So that I can understand the issue without losing my current task list.

**Acceptance Criteria:**

**Given** the API is unreachable or returns a 5xx error on any mutation
**When** TanStack Query reports an error state
**Then** `ErrorBanner.tsx` renders a non-blocking error message at the top of the page
**And** the existing todo list remains visible and the app does not crash

**Given** an error banner is displayed
**When** the user performs a successful action
**Then** the error banner disappears

**Given** the page throws an unhandled rendering error
**When** Next.js catches it via the error boundary
**Then** `app/error.tsx` renders with a user-friendly message and a "Try again" button that calls `reset()`

**And** `app/error.tsx` is a `"use client"` component implementing the exact interface with `error: Error & { digest?: string }` and `reset: () => void` props
**And** `ErrorBanner.tsx` is a `"use client"` component driven by TanStack Query mutation `error` state

---

## Epic 4: Production-Ready & Deployable

The app is tested, documented, and deployable with a single `docker-compose up` command. A developer or interviewer can clone, run, and evaluate it with confidence.

### Story 4.1: Backend API Integration Tests

As a developer,
I want integration tests for all four API endpoints,
So that regressions are caught automatically and the API contract is verified.

**Acceptance Criteria:**

**Given** the test suite is run with `npm test` in `backend/`
**When** all tests complete
**Then** all tests pass with exit code 0

**Given** the test database
**When** tests run
**Then** they use a separate in-memory or temp SQLite instance (not the development database)

**And** Supertest tests cover:
- `GET /api/todos` — returns empty array; returns todos ordered correctly
- `POST /api/todos` — creates todo; rejects blank text; rejects text > 500 chars
- `PUT /api/todos/:id` — updates text; toggles completion; returns 404 for unknown id
- `DELETE /api/todos/:id` — deletes todo and returns 204; returns 404 for unknown id

**And** test files are co-located: `todoService.test.ts` next to `todoService.ts`

---

### Story 4.2: Frontend Component Tests

As a developer,
I want component tests for key UI components,
So that component behaviour is verified and regressions are caught.

**Acceptance Criteria:**

**Given** the test suite is run with `npm test` in `frontend/`
**When** all tests complete
**Then** all tests pass with exit code 0

**And** Vitest + React Testing Library tests cover:
- `AddTodo.tsx` — renders input; submits on Enter; shows validation error on empty submit; clears input on success
- `TodoItem.tsx` — renders text; checkbox toggles completion; delete button calls handler; edit mode activates on trigger and cancels on Escape
- `TodoList.tsx` — renders active and completed sections; shows empty state when no todos; shows all-done state when all completed
- `ErrorBanner.tsx` — renders when error prop is provided; does not render when no error

**And** test files are co-located with their components (`TodoItem.test.tsx` next to `TodoItem.tsx`)

---

### Story 4.3: Docker & docker-compose

As a developer,
I want the full stack to start with a single `docker-compose up` command,
So that anyone can run the app without any manual setup.

**Acceptance Criteria:**

**Given** Docker and docker-compose are installed
**When** `docker-compose up` is run from the repository root
**Then** both the frontend (port 3000) and backend (port 4000) start successfully
**And** the todo app is accessible at `http://localhost:3000`

**Given** todos are created and `docker-compose restart` is run
**When** the app restarts
**Then** all previously created todos are still present (SQLite volume persisted)

**Given** the backend Dockerfile
**When** it is inspected
**Then** it uses a multi-stage build with `node:22-alpine` for both build and runtime stages
**And** `node_modules` (including the compiled `better-sqlite3` binary) is copied from the build stage to the runtime stage

**And** `docker-compose.yml` defines a named volume `todo-data` mounted at `/data` in the backend container
**And** `DATABASE_PATH=/data/todos.db` and `NEXT_PUBLIC_API_URL` pointing to the backend service are set via environment variables

---

### Story 4.4: Documentation, Accessibility & Final Polish

As a developer or evaluator,
I want a clear README and an accessible, polished UI,
So that the project communicates quality and is usable by everyone.

**Acceptance Criteria:**

**Given** a developer clones the repository
**When** they read the README
**Then** they find: project overview, tech stack table, prerequisites, `docker-compose up` quickstart, local dev instructions (without Docker), environment variables reference, and API endpoint summary

**Given** the app is used with keyboard only
**When** the user navigates using Tab, Enter, and Escape
**Then** all actions (add, complete, delete, edit) are fully accessible without a mouse
**And** focus is visible on all interactive elements

**Given** the app is rendered at 375px width (mobile)
**When** the UI is inspected
**Then** all touch targets are at least 44×44px, the layout adapts correctly, and no horizontal scroll appears

**Given** a screen reader is active
**When** the user navigates the todo list
**Then** all interactive elements have descriptive ARIA labels (e.g. `aria-label="Mark 'Buy milk' as complete"`)

**And** the Lighthouse accessibility score is ≥ 90
**And** all browser console errors and warnings are resolved
