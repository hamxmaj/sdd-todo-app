---
stepsCompleted: ["discovery", "vision", "success", "journeys", "functional", "nonfunctional", "scoping", "polish"]
inputDocuments: ["original-prd-draft"]
workflowType: "prd"
---

# Product Requirements Document — sdd-todo-app

**Author:** Hamza  
**Date:** 2026-03-29  
**Version:** 1.1 (Refined)  
**Status:** Ready for Architecture

---

## 1. Executive Summary

The `sdd-todo-app` is a full-stack Todo application built to demonstrate clean, production-quality engineering practices across a React + Node.js/Express + SQLite stack. The application enables individual users to manage personal tasks through a fast, responsive, and intuitive interface — covering the full lifecycle of a task: creation, editing, completion, and deletion.

The project is intentionally minimal in scope to preserve focus on technical quality, clean architecture, and solid fundamentals. It is designed to serve as a skills demonstration artifact and a credible portfolio piece, with an architecture that does not block future extension.

---

## 2. Problem Statement

Task management is a universal need, but most tools are over-engineered for simple personal use. A developer learning full-stack engineering needs a scoped, real-world project that exercises the full stack — data persistence, API design, UI state management, responsive layout — without being overwhelmed by domain complexity.

The gap this fills: a reference-quality, deployable full-stack application with a clean separation of concerns, sensible defaults, and no accidental complexity.

---

## 3. Goals

### 3.1 Primary Goals

| # | Goal | Why It Matters |
|---|------|----------------|
| G1 | Deliver a fully functional CRUD todo experience | Validates the core user journey end-to-end |
| G2 | Demonstrate clean full-stack architecture (React + Express + SQLite) | Primary purpose of the project |
| G3 | Ship a Docker-composable deployment | Proves production-readiness and portability |
| G4 | Handle edge cases gracefully (empty states, errors, loading) | Signals engineering maturity beyond the happy path |

### 3.2 Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| All 5 core task actions work without guidance | Manual walkthrough: create, view, edit, complete, delete — zero errors |
| Data persists across browser refresh and container restart | Refresh test + docker restart test pass |
| UI renders correctly on mobile (375px) and desktop (1280px+) | Chrome DevTools responsive check |
| API response time under normal load < 200ms | Local benchmark for all endpoints |
| Zero uncaught errors in browser console during normal use | Chrome DevTools console inspection |

---

## 4. User Persona

**Name:** Alex, the solo developer  
**Context:** Building or reviewing this as a portfolio project / technical interview reference  
**Goals:** Quickly see and manage a personal task list; validate that the app works correctly across all scenarios  
**Technical level:** Comfortable running Docker, hitting API endpoints, and reading code  
**Frustrations:** Slow feedback loops, broken states, inconsistent UX between actions

> Note: Multi-user support and authentication are explicitly out of scope for v1. The persona is a single, unauthenticated user operating the app in isolation.

---

## 5. User Journeys

### Journey 1: First Load
1. User opens the app in a browser
2. Sees a loading state briefly while todos are fetched
3. Sees either the full todo list, or a clear empty state ("No tasks yet — add one above")
4. Can immediately begin adding tasks — no onboarding, no modals

### Journey 2: Create a Task
1. User types a task description in the input field
2. Presses Enter or clicks "Add"
3. Task appears immediately at the top of the active list
4. Input field is cleared and focused, ready for the next entry

### Journey 3: Edit a Task
1. User clicks the edit icon / double-clicks on a todo item
2. The todo text becomes an inline editable input
3. User modifies the text and confirms (Enter or blur)
4. The updated text is saved and displayed immediately
5. If the user presses Escape, the edit is cancelled with no change

### Journey 4: Complete a Task
1. User clicks the checkbox on an active todo
2. Todo moves to the "Completed" section at the bottom of the list
3. Todo text is visually struck through and dimmed
4. Clicking the checkbox again (uncomplete) moves it back to active

### Journey 5: Delete a Task
1. User clicks the delete icon on a todo item
2. Todo is removed from the list immediately
3. No confirmation dialog (v1 keeps interactions fast)

### Journey 6: Error Recovery
1. API is unreachable (server down, network error)
2. User sees a non-blocking error message (e.g. toast or inline banner)
3. App does not crash; existing displayed todos remain visible
4. User can retry the failed action

---

## 6. Functional Requirements

### 6.1 Todo Item Data Model

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID or auto-increment integer | Primary key, system-generated |
| `text` | String | Required, 1–500 characters |
| `completed` | Boolean | Default: `false` |
| `created_at` | ISO 8601 timestamp | System-generated on create |
| `updated_at` | ISO 8601 timestamp | System-updated on edit/complete |

### 6.2 Core Features

#### F1 — List Todos
- Fetch and display all todos on page load
- Active todos displayed above completed todos
- Within each group, order by `created_at` descending (newest first)
- Empty state message shown when no todos exist
- Loading state shown while data is being fetched

#### F2 — Create Todo
- Single-line text input at the top of the page
- Accepts text 1–500 characters
- Triggered by Enter key or submit button
- Trims leading/trailing whitespace before saving
- Rejects blank submissions (client-side validation)
- On success: new todo appears at top of active list, input is cleared and refocused

#### F3 — Edit Todo
- Inline edit triggered by clicking an edit button or double-clicking the todo text
- Editable input pre-populated with current text
- Confirm with Enter or blur; cancel with Escape
- Trims whitespace; rejects empty text (reverts to original on empty submit)
- Changes persisted immediately via API call
- Edit only available on active (non-completed) todos in v1

#### F4 — Complete / Uncomplete Todo
- Checkbox per todo item
- Toggling completion updates `completed` field and `updated_at`
- Completed todos move to the bottom section with visual distinction (strikethrough + reduced opacity)
- Toggle is reversible

#### F5 — Delete Todo
- Delete button visible on hover (desktop) / always visible (mobile)
- Immediately removes todo from list and deletes from database
- No confirmation dialog in v1

### 6.3 UI States

| State | Behaviour |
|-------|-----------|
| Loading | Spinner or skeleton shown while API fetch is in progress |
| Empty (no todos) | Friendly message: "No tasks yet — add one above" |
| Empty (all completed) | Message: "All done! Great work." |
| API Error | Non-blocking error banner/toast; does not clear existing list |
| Validation Error | Inline message under input (e.g. "Task can't be empty") |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | All API responses < 200ms under normal local load; UI actions (optimistic or confirmed) feel instantaneous |
| **Responsiveness** | Layout adapts cleanly from 375px (mobile) to 1440px+ (desktop); touch targets ≥ 44px |
| **Accessibility** | Keyboard navigable; ARIA labels on interactive elements; sufficient colour contrast (WCAG AA minimum) |
| **Reliability** | Data persists across server restarts (SQLite file-backed); no data loss on browser refresh |
| **Maintainability** | Clear project structure, consistent naming, no dead code; README with setup instructions |
| **Portability** | Single `docker-compose up` command starts the full stack; no manual env setup required |
| **Error Handling** | All API errors return structured JSON `{ error: string }`; client handles 4xx/5xx without crashing |
| **Security (baseline)** | Input sanitised server-side; SQL injection prevented via parameterised queries |

---

## 8. Technical Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 15 (App Router) | Modern React framework; demonstrates Server Components, RSC boundary, and routing patterns |
| Frontend Styling | Tailwind CSS v4 | Built into create-next-app; utility-first, no scoping issues |
| Backend | Node.js + Express 5 | Minimal, well-understood; explicitly separate from Next.js API routes |
| Database | SQLite (via Knex) | Zero-config, file-based, sufficient for v1; Knex abstraction allows future DB swap |
| Containerisation | Docker + docker-compose | Full-stack portability; single command startup |
| API Style | REST (JSON over HTTP) | Simple, universally understood, appropriate for CRUD |

---

## 9. API Design (High-Level)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | Retrieve all todos |
| `POST` | `/api/todos` | Create a new todo |
| `PUT` | `/api/todos/:id` | Update todo text and/or completion status |
| `DELETE` | `/api/todos/:id` | Delete a todo |

All endpoints return `Content-Type: application/json`. Errors return `{ "error": "<message>" }` with an appropriate HTTP status code.

---

## 10. Deployment Architecture

```
┌─────────────────────────────────────────┐
│             docker-compose              │
│                                         │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │  Frontend   │    │    Backend      │ │
│  │  React App  │───▶│  Express API    │ │
│  │  :3000      │    │  :4000          │ │
│  └─────────────┘    └────────┬────────┘ │
│                              │          │
│                     ┌────────▼────────┐ │
│                     │  SQLite DB      │ │
│                     │  (volume mount) │ │
│                     └─────────────────┘ │
└─────────────────────────────────────────┘
```

- Frontend container serves the React app (or uses Vite dev server in development)
- Backend container runs the Express API
- SQLite database file is mounted as a Docker volume to persist data across container restarts
- A single `docker-compose up` command starts the entire stack

---

## 11. Out of Scope — v1

The following are explicitly excluded from v1 to maintain focus:

| Feature | Status |
|---------|--------|
| User authentication / accounts | ❌ v1 out of scope |
| Multi-user support | ❌ v1 out of scope |
| Task prioritisation (high/medium/low) | ❌ v1 out of scope |
| Due dates and deadlines | ❌ v1 out of scope |
| Notifications / reminders | ❌ v1 out of scope |
| Task categories / labels | ❌ v1 out of scope |
| Collaboration / sharing | ❌ v1 out of scope |
| Bulk operations | ❌ v1 out of scope |
| Drag-and-drop reordering | ❌ v1 out of scope |
| Edit of completed todos | ❌ v1 out of scope |
| Undo / redo | ❌ v1 out of scope |
| Search / filter | ❌ v1 out of scope |

---

## 12. Future Considerations

Architecture decisions in v1 that deliberately leave the door open for future growth:

- **Auth-ready API structure**: Route handlers isolated such that auth middleware can be inserted without restructuring
- **User-id column stub**: Database schema includes a nullable `user_id` field (unused in v1) to enable multi-tenancy migration later
- **Stateless backend**: Express API is intentionally stateless; sessions or JWTs can be layered on top without refactoring
- **SQLite → Postgres migration path**: Use of a query builder (Knex) or ORM allows swapping the database driver with minimal code change

---

## 13. Open Questions

None — all major decisions resolved in requirements discovery (2026-03-29).
