# Prompt Engineering Log
## AI-Assisted Development of sdd-todo-app

**Author:** Hamza Majeed  
**Project:** `sdd-todo-app` — Full-stack Todo App (Express 5 + Next.js 16 + SQLite + Vitest + Playwright)  
**Tool:** Cursor IDE with Claude Sonnet  
**Date:** March 2026

---

## Overview

This document records the prompt engineering work done during AI-assisted development of `sdd-todo-app`. It covers three areas:

1. **App development** — building the backend service layer, controller, and frontend components
2. **Ruleset creation** — defining 6 custom Cursor rules to enforce project conventions
3. **MCP server evaluation** — testing Postman MCP and Chrome DevTools MCP in a practical context

For each area, the document shows the initial prompt, the iterative refinement steps, the final result, and annotations on which prompting techniques were applied.

---

## Part 1: App Development

### 1.1 Backend — Service Layer (`todoService.ts`)

#### Initial Prompt (Attempt 1)

> "Write a todo service in TypeScript for Express."

**Problem with this prompt:** No context about the database (Knex + SQLite), no constraint on error handling style, no mention of the `TodoRow`/`Todo` separation. The agent produced a generic Mongoose-style service that imported `mongoose` — completely wrong stack.

**Technique used:** None — this is the baseline "vague instruction" anti-pattern.

---

#### Refinement — Adding Context (Attempt 2)

> "Write a `createTodoService` factory function in TypeScript. It takes a `Knex` instance. It should implement `getAll`, `create`, `update`, and `remove`. The database table is called `todos`. Use `TodoRow` (snake_case columns: `id`, `text`, `completed`, `user_id`, `created_at`, `updated_at`) as the DB type and `Todo` (camelCase) as the return type. Map between them inside the service."

**What improved:** The agent now produced a factory function with the correct Knex API. However it:
- Used `throw new Error('Not found')` with no `statusCode` — wouldn't map to the right HTTP status
- Returned the raw `TodoRow` from `create` instead of calling the mapper

**Technique used:** **Context injection** — telling the agent about the DB schema and type system narrowed the output significantly.

---

#### Refinement — Few-Shot Error Handling (Attempt 3)

Prepended this example before the main instruction:

> "When throwing errors in this project, always attach a statusCode property. Example:
> ```typescript
> const err = new Error('Todo not found') as Error & { statusCode: number };
> err.statusCode = 404;
> throw err;
> ```
> Now write `createTodoService`…"

**What improved:** The agent correctly attached `statusCode` to all thrown errors, matching what `errorHandler.ts` middleware expects. The `remove` function correctly checks `count === 0` before throwing 404.

**Technique used:** **Few-shot prompting** — one concrete before/after example was enough to transfer the error-handling pattern consistently across all four methods.

---

#### Final Prompt (Attempt 4) — Decomposition

Rather than asking for the whole service at once, the task was broken into steps:

> **Step 1:** "Write only the `toTodo` mapper function that converts a `TodoRow` to `Todo`."  
> **Step 2:** "Now write `getAll` using this mapper. Use `orderByRaw('completed ASC, created_at DESC')`."  
> **Step 3:** "Write `create`. After inserting, re-fetch the row by id and return `toTodo(row!)`."  
> **Step 4:** "Write `update`. First check the row exists, throw 404 if not. Conditionally spread `text` and `completed` into the update object. Then re-fetch and return the mapped row."  
> **Step 5:** "Write `remove`. Use `delete()` and check the affected count is non-zero, otherwise throw 404."

**Final result:** Matched the actual `todoService.ts` almost exactly. The decomposition prevented the agent from taking shortcuts (e.g., skipping the existence check on update) that appeared when the whole function was requested at once.

**Technique used:** **Task decomposition** — splitting a complex function into atomic steps, each verifiable independently, produced cleaner output than one large prompt.

---

**Final code produced (`backend/src/services/todoService.ts`):**

```typescript
function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTodoService(db: Knex) {
  async function getAll(): Promise<Todo[]> {
    const rows = await db<TodoRow>('todos').orderByRaw('completed ASC, created_at DESC');
    return rows.map(toTodo);
  }

  async function update(id: number, input: UpdateTodoInput): Promise<Todo> {
    const existing = await db<TodoRow>('todos').where({ id }).first();
    if (!existing) {
      const err = new Error('Todo not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    await db<TodoRow>('todos').where({ id }).update({
      ...(input.text !== undefined && { text: input.text }),
      ...(input.completed !== undefined && { completed: input.completed ? 1 : 0 }),
      updated_at: db.fn.now() as unknown as string,
    });
    const updated = await db<TodoRow>('todos').where({ id }).first();
    return toTodo(updated!);
  }
  // ... getAll, create, remove follow the same pattern
}
```

---

### 1.2 Backend — Controller (`todoController.ts`)

#### Initial Prompt

> "Write Express route handlers for the todo CRUD operations."

**Problem:** Agent generated inline `req.body` access with no validation, returned raw DB rows, and used `res.status(500).json({ error })` directly instead of calling `next(err)`.

---

#### Refined Prompt — Chain of Thought

> "I need you to think through this step by step before writing any code:
> 1. Where should validation happen? (hint: use Zod `safeParse` from `../schemas/todoSchemas`)
> 2. How should validation errors be communicated? (hint: attach statusCode = 400 and call next(err))
> 3. Should the controller call `res.json()` directly on errors? (hint: no — use next(err) so the global errorHandler handles it)
> 4. What type does the service return — TodoRow or Todo?
>
> Now write `createTodoController(service: TodoService)` as a factory that returns `{ getAll, create, update, remove }`."

**What improved:** By forcing the agent to reason through the constraints before generating code, the output matched the project patterns exactly — `safeParse` used for validation, `next(err)` called consistently, no direct `res.status(500)` bypassing the middleware.

**Technique used:** **Chain of Thought (CoT) prompting** — asking the agent to "think step by step" through the design constraints before generating code prevented the most common anti-patterns. This was the single most impactful technique used in this project.

---

**Final code produced (`backend/src/controllers/todoController.ts`):**

```typescript
async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Validation error';
      const err = new Error(message) as Error & { statusCode: number };
      err.statusCode = 400;
      return next(err);
    }
    const todo = await service.create(parsed.data);
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}
```

---

### 1.3 Frontend — `AddTodo.tsx` Component

#### Initial Prompt

> "Write a React component to add a new todo."

**Problem:** Agent used `useEffect` to reset the form after submission, used the old TanStack Query v4 positional API (`useMutation(fn)`), and forgot to invalidate the query cache after success — so the list never re-fetched.

---

#### Refined Prompt — Role + Few-Shot + Constraints

> "You are a senior React developer working on a Next.js App Router project.
>
> Requirements:
> - Use TanStack Query v5 (object-only API: `useMutation({ mutationFn, onSuccess })`)
> - After a successful create, call `queryClient.invalidateQueries({ queryKey: ['todos'] })` to refresh the list
> - Use `isPending` (not `isLoading`) for the loading state
> - Use a `useRef` to restore focus to the input after submission
> - Show an inline validation error (not a toast) if the user submits an empty string
> - The submit button should show a spinner when `isPending` is true
>
> Here is an example of how mutations are done in this codebase:
> ```typescript
> const { mutate, isPending } = useMutation({
>   mutationFn: createTodo,
>   onSuccess: () => {
>     queryClient.invalidateQueries({ queryKey: ['todos'] });
>   },
> });
> ```
>
> Now write the full `AddTodo` component."

**What improved:** The agent produced a component that:
- Used the v5 mutation API correctly
- Invalidated the cache on success
- Used `useRef` for focus management
- Had proper `aria-invalid` / `aria-describedby` accessibility attributes
- Used `isPending` not `isLoading`

**Technique used:** **Role prompting + few-shot + explicit constraint list** — combining a role ("senior React developer"), a concrete example of the mutation pattern, and a checklist of requirements produced output that needed almost no editing.

---

**Final code pattern in `frontend/components/AddTodo.tsx`:**

```typescript
const { mutate, isPending } = useMutation({
  mutationFn: (text: string) => createTodo({ text }),
  onSuccess: () => {
    setValue('');
    setValidationError('');
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    inputRef.current?.focus();
  },
});
```

---

### 1.4 Frontend — `TodoList.tsx` — Server Component Architecture

#### Initial Prompt

> "Write a TodoList component that fetches and displays todos."

**Problem:** Agent added `'use client'` to `app/page.tsx` (the page itself), wiping out the Server Component advantage and making the initial page load depend on a client-side fetch waterfall.

---

#### Refined Prompt — Decomposition + CoT

> "Think step by step about the Next.js App Router component boundary:
> 1. `app/page.tsx` is a Server Component. It can `await` data directly.
> 2. `TodoList.tsx` needs `useState` and `useQuery`, so it must be `'use client'`.
> 3. The page should fetch initial todos server-side and pass them as `initialData` to React Query to avoid a loading flash.
>
> Given this, write:
> - `app/page.tsx` as a Server Component that fetches todos and passes them as `initialTodos` prop
> - `components/TodoList.tsx` as a Client Component that accepts `initialTodos` and uses `useQuery` with `initialData`"

**What improved:** The agent correctly split the concern — RSC for the data fetch, client component for interactivity — and used React Query's `initialData` option to hydrate the cache from server-fetched data. No loading spinner on first paint.

**Technique used:** **Decomposition + Chain of Thought** — separating the "what goes on the server" question from the "what goes on the client" question, and walking through the reasoning explicitly, prevented the common mistake of making the whole page a client component.

---

## Part 2: Ruleset Creation

### Context

After building the app, patterns were identified that the AI consistently got wrong without guidance. Six custom Cursor rules were created in `.cursor/rules/` to encode these patterns as persistent instructions.

### Prompt Process

#### Initial approach — single large rule

> "Create a rule file that covers all the TypeScript conventions for this project."

**Problem:** The resulting rule was 200+ lines covering everything from DB mapping to React patterns. Cursor's rule system works best with focused, single-concern rules that activate on specific file globs. A monolithic rule was too noisy and the agent started ignoring parts of it.

---

#### Refined approach — one concern per rule, with file scope

The task was decomposed into six separate rules, each targeting a specific file pattern:

| Rule file | Glob | Concern |
|-----------|------|---------|
| `typescript-error-handling.mdc` | `backend/**/*.ts` | Typed errors with `statusCode` |
| `zod-validation.mdc` | `backend/src/**/*.ts` | `safeParse` not `parse` |
| `react-query-patterns.mdc` | `frontend/**/*.tsx` | TanStack v5 object API |
| `nextjs-app-router.mdc` | `frontend/**/*.tsx` | Server vs client boundary |
| `test-conventions.mdc` | `**/*.test.{ts,tsx}` | `userEvent` not `fireEvent` |
| `db-layer-row-mapping.mdc` | `backend/src/**/*.ts` | `TodoRow` → `Todo` in service only |

Each rule used the same structure: a **bad example**, a **good example**, and a concise bullet-list of rules. This few-shot format within the rule itself trains the agent to prefer the correct pattern without needing to re-explain it in every prompt.

**Technique used:** **Decomposition + few-shot within rules** — splitting conventions into focused, scoped rules with embedded before/after examples is the equivalent of few-shot prompting that persists across sessions.

---

### Before/After: Effect of Rules on Agent Output

#### Without rules — generating a new backend endpoint

Prompt: *"Add a GET /api/todos/:id endpoint."*

Agent output (no rules):
```typescript
// ❌ Throws raw Error — no statusCode
throw new Error('Not found');

// ❌ Returns TodoRow directly — snake_case leaks to API
return db('todos').where({ id }).first();
```

#### With rules active

Same prompt with `typescript-error-handling.mdc` and `db-layer-row-mapping.mdc` active:
```typescript
// ✅ Correct error shape
const err = new Error('Todo not found') as Error & { statusCode: number };
err.statusCode = 404;
throw err;

// ✅ Mapped through toTodo()
const row = await db<TodoRow>('todos').where({ id }).first();
return toTodo(row!);
```

The rules eliminated the two most common mistakes without any extra prompt text.

---

## Part 3: MCP Server Evaluation

### Postman MCP — Prompt Examples

#### Attempt 1 — Vague

> "Set up Postman for this project."

**Problem:** Agent described the process in text but couldn't act on it — it didn't know which MCP tool to call or what the collection structure should be.

---

#### Attempt 2 — Structured with context

> "Use the Postman MCP to create a collection called 'sdd-todo-app'. Read `backend/src/routes/todoRoutes.ts` to find all the endpoints. For each one, create a request with:
> - Method and path from the router
> - `{{base_url}}` as a variable for the host
> - A valid JSON body based on the Zod schema in `backend/src/schemas/todoSchemas.ts`"

**What worked:** Giving the agent both the source files to read AND the output format (variable names, body shape) meant it could call the MCP tools with accurate parameters in one pass.

**Technique used:** **Context injection + output specification** — telling the agent exactly where to find the inputs and what shape the output should take.

---

### Chrome DevTools MCP — Prompt Examples

#### Attempt 1 — Too open-ended

> "Check the app."

**Problem:** Agent didn't know what to check, navigated to the page, took a screenshot, and stopped.

---

#### Attempt 2 — Decomposed verification checklist

> "Do the following checks on http://localhost:3000:
> 1. Are there any JavaScript console errors or warnings?
> 2. When I add a todo, does a POST request fire to `/api/todos`? What status does it return?
> 3. After the POST, does a GET `/api/todos` re-fetch automatically within 1 second?
> 4. Take a screenshot of the final state with the new todo visible."

**What worked:** Breaking the verification into numbered, specific assertions gave the agent a clear checklist to work through, and it reported pass/fail for each one. The open-ended "check the app" produced nothing useful; the numbered list produced a structured QA report.

**Technique used:** **Task decomposition into verifiable assertions** — the same principle as writing unit test cases. Each step has a clear expected outcome the agent can verify.

---

## Summary: Techniques and When They Worked

| Technique | Description | Best for in this project | Effectiveness |
|-----------|-------------|--------------------------|---------------|
| **Chain of Thought (CoT)** | Ask agent to reason through constraints before writing code: *"Think step by step: 1) where does validation go? 2) how are errors thrown?"* | Controller/service design decisions; RSC vs client component architecture | ★★★★★ — most impactful technique |
| **Few-shot prompting** | Provide 1–2 concrete before/after examples: *"In this project, errors are thrown like: `const err = ...; err.statusCode = 404; throw err;` — now write the service"* | Error handling, React Query API, test structure | ★★★★☆ — very effective when you have a clear pattern to transfer |
| **Task decomposition** | Break a complex task into ordered subtasks: *"Write only the mapper. Then write getAll using it. Then write create."* | Long functions with multiple concerns (service layer, full components) | ★★★★☆ — prevents the agent taking shortcuts when writing complex code |
| **Role prompting** | Set persona: *"You are a senior React developer on a Next.js App Router project…"* | Frontend component generation | ★★★☆☆ — helps set the right frame but needs to be combined with other techniques |
| **Context injection** | Tell the agent about the codebase explicitly: stack, file structure, types, constraints | All tasks involving project-specific patterns | ★★★★★ — mandatory baseline; without this, outputs are generic/wrong |
| **Output specification** | Define the exact shape of what you want: *"Return `{ getAll, create, update, remove }` from a factory. Export the return type as `TodoService`."* | Generating code that integrates with existing types | ★★★★☆ — eliminates ambiguity in interface design |
| **Embedded few-shot in rules** | Rules contain ❌ bad / ✅ good examples so the pattern is always in context | Persistent conventions (error handling, React Query, DB mapping) | ★★★★★ — the multiplier effect: the cost is paid once, benefits every session |

---

## Key Learnings

### 1. Vague prompts produce plausible but wrong code

The single biggest improvement came from adding project-specific context — stack, types, file names — before any instruction. Without this, the agent defaults to generic patterns (Mongoose for databases, `useEffect` for data fetching) that don't fit the project.

### 2. CoT prevents architectural mistakes

Asking the agent to reason through "where does X belong?" before writing code was most valuable at decision boundaries: validation in controller vs service, mapping in service vs controller, RSC vs client component. These are the decisions that are cheapest to get right upfront and most expensive to fix later.

### 3. Decomposition outperforms single large prompts for complex outputs

When asking for a complete service or component, the agent rushed to a solution that cut corners. Asking for each function separately, then composing them, produced better-structured, more correct code. The extra round-trips were worth it.

### 4. Rules are persistent few-shot examples

The 6 Cursor rules created in Task 1 are, in effect, few-shot examples that activate automatically on the right files. They turned repeated per-prompt corrections ("remember, use safeParse not parse") into a one-time investment that applies to every future edit in the codebase.

### 5. MCP prompts need the same discipline as code prompts

An open-ended MCP prompt ("check the app") is as useless as an open-ended code prompt ("write the backend"). Structured, decomposed prompts — with numbered verification steps, specific file references, or explicit output format requirements — produced useful, actionable MCP interactions.

---

## Appendix: Prompt Template Library

Templates refined during this project, reusable for future work:

### Backend service method

```
Write `[methodName]` for `[serviceName]`. 
- Takes: [parameters with types]
- Returns: [return type]  
- If [condition], throw an error with statusCode = [N]
- Map DB rows to domain type using `toTodo(row)` inside this function
- Use `db<TodoRow>('[table]')` for all queries
```

### Frontend mutation component

```
Write [ComponentName] using TanStack Query v5.
- On success: invalidateQueries({ queryKey: ['[key]'] })
- Loading state: use `isPending` (not `isLoading`)
- Error handling: [inline validation | propagate via onMutationError prop]
- Accessibility: aria-invalid, aria-describedby on inputs with errors
Example mutation pattern: [paste a minimal useMutation example from this codebase]
```

### CoT preamble for architectural decisions

```
Before writing any code, think step by step:
1. Which layer owns [concern]? (controller / service / route)
2. What type should [thing] be at the boundary between layers?
3. How should errors be communicated to the caller?
4. Does this need to be a client component, or can it be a server component?
Now write [component/function].
```

### MCP verification checklist

```
Check http://localhost:[port]:
1. Are there console errors on load?
2. When [action], does [expected network request] fire? What status?
3. After [action], does the UI update within [N]ms?
4. Take a screenshot of the final state.
Report pass/fail for each step.
```

---

*This document covers work done in the sdd-todo-app repository during the SDD course practical tasks.*
