# Project Brief — sdd-todo-app

**Author:** Hamza  
**Date:** 2026-03-29  
**Type:** Portfolio / Skills Demonstration  
**Status:** Approved for Development

---

## The One-Line Pitch

A clean, production-quality full-stack Todo application demonstrating end-to-end engineering skill across React, Node.js/Express, SQLite, and Docker — built to a real-world standard, not a tutorial standard.

---

## Why This Project Exists

Most portfolio todo apps are throwaway demos — they prove you can follow a tutorial. This one is built to prove something harder: that you understand how to structure a maintainable full-stack system, handle edge cases, think about data integrity, and ship something that actually runs.

The deliberately narrow feature scope is a feature, not a limitation. It creates the space to do the fundamentals *well* — clean API design, proper error handling, responsive UI, persistent storage, and one-command deployment — without complexity hiding poor decisions.

**The real deliverable isn't the todo app. It's the engineering proof-of-work behind it.**

---

## Problem & Opportunity

| | |
|---|---|
| **Problem** | Junior-to-mid developers struggle to demonstrate full-stack capability through portfolio projects. Most examples are either too simple (no persistence, no real API) or too complex (premature abstraction, over-engineered). |
| **Opportunity** | A reference-quality, scoped, deployable full-stack app that covers the complete engineering surface area — from React state management to SQLite persistence to Docker compose — without artificial complexity. |
| **Target Audience** | A single developer (Hamza) building for portfolio and technical interview demonstration. The app's end-user is incidental; the engineering audience is primary. |

---

## What We're Building

A browser-based task management application with:

- A **React frontend** — fast, responsive, with clean component architecture
- A **Node.js/Express REST API** — minimal, well-structured, with proper error handling
- A **SQLite database** — file-backed, persistent, zero-config
- **Docker + docker-compose** — full stack boots in one command

The user experience is simple and deliberate: see your tasks, add tasks, edit tasks, check them off, delete them. No accounts. No clutter. No explanations needed.

---

## Core Features

| Feature | Description |
|---------|-------------|
| **View todos** | Full list on load; active tasks on top, completed below |
| **Create todo** | Type and press Enter; input clears and refocuses |
| **Edit todo** | Inline edit on active todos; confirm or cancel |
| **Complete / Uncomplete** | Checkbox toggle; visual distinction for completed items |
| **Delete todo** | One click; immediate removal |
| **Graceful states** | Loading spinner, empty state message, error banner |
| **Persistent storage** | Data survives browser refresh and container restart |

---

## Technical Approach

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | React (hooks) | Industry-standard; demonstrates real component patterns |
| Backend | Node.js + Express | Minimal, legible, appropriate for CRUD API |
| Database | SQLite | Zero-config; file-backed persistence; Knex allows future DB swap |
| Deployment | Docker + docker-compose | `docker-compose up` = working app; no manual setup |
| API style | REST/JSON | Simple, universal, well-understood |
| Styling | CSS Modules or Tailwind | Clean, scoped — no heavy UI framework dependency |

### Architecture at a Glance

```
Browser (React)
     │
     │ HTTP/REST
     ▼
Express API (Node.js)
     │
     │ SQL (Knex)
     ▼
SQLite Database (volume-mounted)
```

Everything containerised. Frontend on port 3000, API on port 4000. One `docker-compose.yml` to rule them all.

---

## What We Are NOT Building (v1)

This is as important as what we are building.

- No user authentication or accounts
- No multi-user support
- No task priorities, deadlines, or categories
- No notifications or reminders
- No search or filtering
- No drag-and-drop reordering
- No collaboration or sharing
- No bulk operations

These exclusions are permanent for v1. They are not forgotten — they are recorded as future considerations in the PRD with architecture hooks that don't block their addition later.

---

## Success Criteria

The project is complete and successful when:

1. A user can complete all 5 core actions (add, view, edit, complete, delete) without any guidance or errors
2. Data persists correctly across browser refreshes and `docker-compose restart`
3. The UI renders correctly on mobile (375px) and desktop (1280px)
4. All API responses return in < 200ms under local conditions
5. No uncaught errors appear in the browser console during normal usage
6. The full stack starts with a single `docker-compose up` command
7. The codebase is clean, readable, and includes a working README

---

## Constraints & Risks

| Constraint / Risk | Mitigation |
|-------------------|-----------|
| SQLite not suitable for production multi-user load | Acceptable for v1 scope; Knex abstracts DB layer for future swap |
| No auth = all data is globally accessible | Intentional for v1; route structure prepared for auth middleware |
| Docker required to run full stack | README must include clear instructions; dev mode without Docker should also work |
| SQLite file lost if Docker volume misconfigured | Volume mount documented clearly in compose file |

---

## Deliverables

| Artefact | Description |
|----------|-------------|
| `prd.md` | Full Product Requirements Document (this project) |
| `project-brief.md` | This document |
| Frontend (React) | Responsive React app with all 5 core user journeys |
| Backend (Express) | REST API with 4 endpoints; structured error handling |
| Database schema | SQLite schema with todos table + future-proofed `user_id` stub |
| `docker-compose.yml` | Single-command full-stack startup |
| `README.md` | Setup instructions, architecture overview, dev/prod commands |

---

## Next Steps

| Step | Owner | When |
|------|-------|------|
| Create technical architecture document | Architect | After brief approval |
| Define epics and user stories | PM / SM | After architecture |
| Sprint planning | SM | After stories |
| Implementation (Epic 1: Backend API) | Dev | Sprint 1 |
| Implementation (Epic 2: Frontend) | Dev | Sprint 1–2 |
| Implementation (Epic 3: Docker + Polish) | Dev | Sprint 2 |

---

*This brief is derived from the refined PRD at `_bmad-output/planning-artifacts/prd.md`.*
