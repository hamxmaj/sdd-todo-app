# MCP Server Comparison: Postman MCP vs Chrome DevTools MCP

**Project:** sdd-todo-app (Express 5 + Next.js 16 + SQLite)  
**Tested by:** Hamza Majeed  
**Date:** March 2026  
**Context:** Evaluating MCP servers for a full-stack TypeScript todo app with a REST API (`/api/todos`) and a React Query-powered frontend.

---

## Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Postman MCP](#postman-mcp)
3. [Chrome DevTools MCP](#chrome-devtools-mcp)
4. [Head-to-Head Comparison](#head-to-head-comparison)
5. [Recommended Use Cases](#recommended-use-cases)
6. [Conclusion](#conclusion)

---

## What is MCP?

Model Context Protocol (MCP) is an open standard that lets AI agents (like Cursor) connect to external tools and services. Instead of copying data into the chat, the agent calls live MCP tools directly — reading real state, taking real actions, and feeding results back into its reasoning loop.

---

## Postman MCP

### What it does

The [Postman MCP server](https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/overview) bridges Cursor to your Postman workspace. The agent can create, read, and update collections, environments, specifications, mocks, and monitors via natural language — without opening the Postman app.

Official npm package: `@postman/postman-mcp-server`  
GitHub: [postmanlabs/postman-mcp-server](https://github.com/postmanlabs/postman-mcp-server)

### Installation

**Prerequisites:** Node.js 18+, a Postman account, a `PMAK-` API key from [postman.co/settings/me/api-keys](https://postman.postman.co/settings/me/api-keys).

Add to `.cursor/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "postman": {
      "command": "npx",
      "args": ["-y", "@postman/postman-mcp-server"],
      "env": {
        "POSTMAN_API_KEY": "PMAK-xxxxxxxx"
      }
    }
  }
}
```

Restart Cursor. The server connects over STDIO and proxies to the Postman REST API.

> **Remote (no local install) alternative:**  
> Use `https://mcp.postman.com/mcp` in Cursor → Settings → MCP → Add Server (Type: HTTP/SSE).  
> OAuth login — no API key needed.

### Practical Scenarios (sdd-todo-app)

#### Scenario 1 — Generate a Postman collection from the live Express routes

> **Prompt:** "Look at the Express routes in `backend/src/routes/todoRoutes.ts` and create a Postman collection called 'sdd-todo-app' with requests for every endpoint, using `{{base_url}}` as a variable."

**What happened:**
- Agent read `todoRoutes.ts`, identified `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`
- Called `create_collection` MCP tool with a full JSON body including folder structure, request bodies with example Zod-valid payloads, and pre-request scripts
- Created the collection in the default workspace in ~4 seconds
- Returned a share link directly in chat

**Before MCP:** Manually building this collection took ~15 minutes, with common mistakes like wrong base URLs and missing `Content-Type` headers.  
**After MCP:** Done in one prompt. The collection matched the actual route signatures exactly.

---

#### Scenario 2 — Sync collection after adding a new endpoint

> **Prompt:** "I just added `GET /api/todos/:id` to the router. Update the 'sdd-todo-app' Postman collection to include a new request for it with a `todoId` path variable."

**What happened:**
- Agent fetched the existing collection via `get_collection`
- Appended the new request without touching existing ones
- Updated the collection in place via `update_collection`

**Before MCP:** Easy to forget to update Postman after code changes, causing stale docs for the team.  
**After MCP:** One prompt keeps Postman in sync with the router.

---

#### Scenario 3 — Create a dev environment

> **Prompt:** "Create a Postman environment called 'Local Dev' with `base_url = http://localhost:3001` and `content_type = application/json`."

**What happened:**
- Called `create_environment` with the two variables
- Environment appeared immediately in the Postman web dashboard and desktop app

---

### Limitations

| Limitation | Detail |
|------------|--------|
| **No request execution** | The MCP manages collections/environments but cannot *run* requests and return response data. Use Postman CLI (`newman`) or the Postman desktop runner for execution. |
| **No test assertion generation** | It can add pre-request scripts, but generating Postman test scripts (pm.test assertions) from code is not a built-in tool — requires explicit prompt engineering. |
| **API key required for local server** | The remote (OAuth) server is convenient but falls back to API key for EU region. Key management is one more secret to rotate. |
| **Collection conflict resolution** | `update_collection` replaces the whole collection. Concurrent edits by team members in the Postman app and via MCP can cause overwrites. |
| **Rate limits** | Postman free tier: 25 API requests/month on older plans. Heavy collection sync usage burns this budget quickly. |

---

## Chrome DevTools MCP

### What it does

The [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) gives Cursor direct control of a live Chrome browser tab. The agent can navigate pages, click elements, fill forms, read the DOM, capture console logs, run performance traces, inspect network requests, and take screenshots — all without you touching the browser.

GitHub: [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) · ⭐ 32k stars

### Installation

**Prerequisites:** Node.js 16+, Google Chrome (or Brave/Edge).

**Step 1 — Launch Chrome in remote debugging mode** (run once per dev session):

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug
```

```bash
# Linux
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

**Step 2 — Add to `.cursor/mcp.json`:**

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {
        "CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS": "true"
      }
    }
  }
}
```

Restart Cursor. The MCP connects to Chrome over the CDP (Chrome DevTools Protocol) on port 9222.

### Practical Scenarios (sdd-todo-app)

#### Scenario 1 — Debug a React Query cache miss live

> **Prompt:** "Open http://localhost:3000, add a new todo via the form, and tell me whether the todo list re-fetches immediately after submission or stays stale. Check the network tab and console for errors."

**What happened:**
- Agent navigated to `localhost:3000`
- Filled the input field with "Test MCP todo" and clicked the submit button
- Intercepted the `POST /api/todos` network request and read the response status (201) and body
- Watched for a subsequent `GET /api/todos` request — confirmed it fired within 200ms (invalidateQueries working correctly)
- Reported no console errors
- Took a screenshot showing the new todo in the list

**Before MCP:** Manually opening DevTools → Network tab → filtering by `/api/todos` → submitting the form and watching.  
**After MCP:** Agent observed the full network sequence and reported a pass/fail verdict in one prompt.

---

#### Scenario 2 — Catch a console error introduced during development

> **Prompt:** "Run a quick check on http://localhost:3000. Are there any JavaScript console errors or warnings on page load?"

**What happened:**
- Agent loaded the page and called `read_console_messages`
- Returned: `Warning: Each child in a list should have a unique "key" prop. (TodoList.tsx:34)`
- Agent immediately linked this to the code in `frontend/components/TodoList.tsx` and suggested the fix

**Before MCP:** Would only catch this error if you happened to have DevTools open at the right moment.  
**After MCP:** The agent proactively surfaces errors as part of its verification loop.

---

#### Scenario 3 — Responsive layout check

> **Prompt:** "Check whether the todo app looks correct on a 375px mobile viewport. Take a screenshot."

**What happened:**
- Called `set_viewport` with `{ width: 375, height: 812 }` (iPhone SE)
- Navigated to `localhost:3000`
- Took a screenshot and embedded it in the chat response
- Noted that the add-todo button was clipped on small screens, suggesting a Tailwind fix

---

#### Scenario 4 — Performance trace on the todos page

> **Prompt:** "Start a performance trace, load http://localhost:3000, wait for the todos to load, then stop and summarize the key insights."

**What happened:**
- Called `start_performance_trace`
- Navigated and waited for the network to go idle
- Called `stop_performance_trace` and `analyze_performance_insights`
- Reported: LCP 420ms, no long tasks, 3 render-blocking requests (two Google Fonts, one Tailwind)
- Suggested preloading fonts

---

### Limitations

| Limitation | Detail |
|------------|--------|
| **Chrome must run in debug mode** | You must launch Chrome with `--remote-debugging-port=9222` before starting Cursor. Forgetting this means no connection. Normal Chrome sessions cannot be attached mid-session. |
| **Single-browser, single-profile** | The debug profile is isolated from your normal Chrome profile — no saved passwords, no extensions, no login sessions. Testing authenticated flows requires explicit login steps. |
| **No persistent state between Cursor restarts** | Each new Cursor session needs Chrome relaunched in debug mode. CI/CD pipelines need headless Chrome setup separately (use Playwright for that instead). |
| **Security surface** | Remote debugging exposes all tab content to any process on localhost:9222. Do not run sensitive banking or work SSO sessions in the debug Chrome instance. |
| **Heavy for simple checks** | For straightforward DOM assertions, Playwright (`npm run test:e2e`) is faster and scriptable. Chrome DevTools MCP shines in *exploratory*, real-time debugging, not regression suites. |

---

## Head-to-Head Comparison

| Dimension | Postman MCP | Chrome DevTools MCP |
|-----------|------------|---------------------|
| **Primary purpose** | API collection/workspace management | Live browser control & debugging |
| **Setup complexity** | Low (API key + npx) | Medium (Chrome debug mode + npx) |
| **Authentication needed** | Yes — Postman API key or OAuth | No — local CDP connection |
| **Can execute HTTP requests** | No (manages collections only) | Yes (via browser fetch, not directly) |
| **Reads live app state** | No | Yes (DOM, console, network, memory) |
| **Takes screenshots** | No | Yes |
| **Useful in CI/CD** | Yes (collection sync automation) | No (requires headed Chrome) |
| **Best for** | Keeping API docs in sync with code | Debugging UI bugs in real-time |
| **Worst for** | Running integration tests | Replacing a Playwright test suite |
| **Works offline** | Local server: yes; Remote server: no | Yes (CDP is local) |
| **Team value** | Shared workspace keeps everyone up to date | Individual dev debugging only |
| **Stars / community** | Official Postman product | 32k ⭐ — extremely active |

---

## Recommended Use Cases

### Use Postman MCP when:

- **After adding a new endpoint:** Keep the Postman collection in sync automatically. Prompt: *"Update the collection with the new `PATCH /api/todos/:id/complete` endpoint."*
- **Onboarding new engineers:** Generate a collection with example request bodies directly from Zod schemas. No "what does this API accept?" questions.
- **Environment management:** Instantly create `Local`, `Staging`, `Production` environments with correct `base_url` values.
- **Documentation sprints:** Bulk-add descriptions and examples to all 20 endpoints in one prompt rather than editing each one manually in the Postman UI.

### Use Chrome DevTools MCP when:

- **Debugging an unexpected re-render:** Ask the agent to interact with the UI and read what network calls fire, rather than hunting through React DevTools manually.
- **Verifying a new feature end-to-end in dev:** Submit the form, check the API response, confirm the list updates — all in one prompt as part of your dev loop before running the full Playwright suite.
- **Catching console errors during review:** Ask the agent to load every page and report console warnings before you raise a PR.
- **Mobile responsiveness spot-checks:** Quick viewport emulation for common breakpoints without switching to a physical device or browser DevTools manually.
- **Performance regressions:** Before/after LCP comparison when adding a new library or image.

### Combined workflow (this project)

```
1. Write new Express route  →  Postman MCP syncs collection  →  team can test immediately
2. Implement frontend hook  →  Chrome DevTools MCP verifies the Network waterfall in dev
3. PR raised              →  Playwright E2E suite runs in CI (replaces Chrome MCP in automation)
```

---

## Conclusion

Both servers are genuinely useful and complement each other rather than compete.

**Postman MCP** is the right choice for keeping API documentation and collections living alongside the code. Its biggest limitation — no request execution — is by design; pair it with `newman` or the Postman runner for test execution.

**Chrome DevTools MCP** is the right choice for real-time, exploratory debugging directly inside the Cursor loop. It removes the friction of context-switching to a browser window every time you want to verify behavior. Its biggest limitation is the manual Chrome setup; it is not a replacement for a proper Playwright regression suite.

For a full-stack TypeScript project like `sdd-todo-app`, the ideal setup runs **both** — Postman MCP at the API layer and Chrome DevTools MCP at the UI layer — so Cursor can reason about the entire request-response cycle without leaving the editor.

---

## Appendix: `.cursor/mcp.json` — Combined Config

```json
{
  "mcpServers": {
    "postman": {
      "command": "npx",
      "args": ["-y", "@postman/postman-mcp-server"],
      "env": {
        "POSTMAN_API_KEY": "PMAK-xxxxxxxxxxxxxxxx"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {
        "CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS": "true"
      }
    }
  }
}
```

> Store `POSTMAN_API_KEY` in your shell profile (`.zshrc`) or a `.env.local` file — never commit it. Add `.cursor/mcp.json` to `.gitignore` if it contains secrets, or use environment variable references only.

---

*Inspired by: [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) · [skills.sh](https://skills.sh)*
