# OctopMobile MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 1 — point a phone at a self-hosted Octop base URL, password-login, pick an agent, list/create per-agent threads, and complete a streaming chat turn (with Stop).

**Architecture:** Expo Router (file-based `app/`) tabs for Experts + Tasks; Settings as a stack screen. Thin `src/api` HTTP + WS clients against the pinned Octop contract. Tokens in `expo-secure-store`; base URL in secure/async storage. Online-only.

**Tech Stack:** Expo (managed) + TypeScript, Expo Router, `expo-secure-store`, `expo-localization` + simple zh/en dictionaries, `react-native-markdown-display` (or equivalent), Jest for API helpers.

**Spec:** `docs/superpowers/specs/2026-09-11-octop-mobile-design.md`  
**API contract:** `docs/api-contract.md` (pinned Octop `v0.9.32` / `deb7ac81e89b8779fec59378684582efcde70d43`)

## Global Constraints

- Unofficial companion only — About/README copy must say so.
- Phase 1 surfaces only: Settings (stack) + Experts tab + Tasks tab. No Knowledge/Automation/Projects tabs or placeholders.
- Password login only; on 401 clear token → login, preserve base URL.
- Honor `X-Octop-Access-Token` when present (Octop sliding renew); no OIDC.
- WS auth via `?token=`; ship Stop via `{type:"cancel",thread_id}`.
- Online-only; one foreground WS reconnect; cleartext HTTP allowed with one-time warning; no cert bypass.
- Markdown: headings, emphasis, lists, inline/fenced code, links — not tables/math/HTML.
- Non-text stream chunks → “working…” only.
- i18n zh/en from Phase 1.
- Pin remains `v0.9.32` until `docs/api-contract.md` is re-spiked.

## File structure (target)

```
app/
  _layout.tsx                 # root stack: (auth) | (tabs) | settings
  index.tsx                   # redirect by auth state
  (auth)/
    _layout.tsx
    login.tsx                 # base URL + username/password
  (tabs)/
    _layout.tsx               # Experts | Tasks
    experts/index.tsx
    tasks/index.tsx           # thread list for selected agent
    tasks/[threadId].tsx      # chat
  settings.tsx
src/
  api/
    types.ts
    http.ts                   # fetch wrapper, 401, sliding token
    auth.ts
    agents.ts
    threads.ts
    chatWs.ts
  features/
    auth/AuthContext.tsx
    agents/AgentContext.tsx   # selected agent_id
    chat/useChatTurn.ts
  i18n/
    index.ts
    en.ts
    zh.ts
  storage/
    keys.ts
    secure.ts
    preferences.ts            # base URL, cleartext warning ack, locale override
  components/
    HeaderGear.tsx
    MarkdownBubble.tsx
    WorkingIndicator.tsx
    EmptyState.tsx
    ErrorBanner.tsx
__tests__/
  api/http.test.ts
  api/chatWs.url.test.ts
docs/api-contract.md          # already written (Phase 0)
```

---

### Task 1: Scaffold Expo Router app

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `app/_layout.tsx`, `app/index.tsx`, `.gitignore` updates as needed
- Modify: `README.md` (status + pin + smoke link)

**Interfaces:**
- Produces: runnable `npx expo start` project with Expo Router entry

- [ ] **Step 1: Create the Expo app in-repo via Expo CLI**

**Required:** initialize with the Expo CLI only — `npx create-expo-app@latest` (do **not** hand-write `package.json` / Expo config from scratch, and do **not** use a non-Expo RN initializer).

From repo root (do not nest an extra folder):

```bash
npx create-expo-app@latest . --template tabs -y
```

If the template conflicts with existing `README.md` / `docs/`, keep our docs and merge carefully — prefer Expo Router `app/` layout. Remove template “Home/Explore” tabs afterward.

- [ ] **Step 2: Install MVP dependencies**

```bash
npx expo install expo-router expo-secure-store expo-localization expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler
npm install react-native-markdown-display
npm install -D jest @types/jest ts-jest
```

Ensure `package.json` has `"main": "expo-router/entry"`.

- [ ] **Step 3: Configure cleartext capability (dev + LAN)**

In `app.json` / `app.config.ts`, enable Android cleartext and iOS ATS exception for arbitrary loads **only as required for self-host HTTP** (document in README that this is intentional for LAN):

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true
        }
      }
    },
    "android": {
      "usesCleartextTraffic": true
    }
  }
}
```

- [ ] **Step 4: Replace tab screens with Experts + Tasks stubs**

`app/(tabs)/_layout.tsx` — two tabs only (`experts`, `tasks`). Delete Explore/Home template screens.

- [ ] **Step 5: Sanity run**

```bash
npx expo start
```

Expected: app loads; two empty tabs visible.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo Router app for OctopMobile MVP"
```

---

### Task 2: Storage, i18n, and config helpers

**Files:**
- Create: `src/storage/keys.ts`, `src/storage/secure.ts`, `src/storage/preferences.ts`, `src/i18n/en.ts`, `src/i18n/zh.ts`, `src/i18n/index.ts`
- Test: `__tests__/storage/preferences.test.ts` (optional if AsyncStorage mocked; otherwise manual)

**Interfaces:**
- Produces:
  - `getToken(): Promise<string | null>` / `setToken` / `clearToken`
  - `getBaseUrl(): Promise<string | null>` / `setBaseUrl`
  - `getCleartextWarningAck(): Promise<boolean>` / `ackCleartextWarning()`
  - `t(key: string): string` based on device locale (zh* → zh, else en)

- [ ] **Step 1: Keys + secure token storage**

```typescript
// src/storage/keys.ts
export const STORAGE_KEYS = {
  accessToken: "octop.access_token",
  baseUrl: "octop.base_url",
  cleartextAck: "octop.cleartext_ack",
  selectedAgentId: "octop.selected_agent_id",
} as const;
```

```typescript
// src/storage/secure.ts
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "./keys";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
}
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, token);
}
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
}
```

- [ ] **Step 2: Base URL normalization**

```typescript
// src/storage/preferences.ts
export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("BASE_URL_INVALID");
  }
  return trimmed;
}

export function toWsBase(baseUrl: string): string {
  if (baseUrl.startsWith("https://")) return "wss://" + baseUrl.slice("https://".length);
  if (baseUrl.startsWith("http://")) return "ws://" + baseUrl.slice("http://".length);
  throw new Error("BASE_URL_INVALID");
}
```

Persist `baseUrl` and `cleartextAck` via `SecureStore` or `AsyncStorage` (either is fine; prefer SecureStore for base URL consistency).

- [ ] **Step 3: zh/en dictionaries**

Minimum keys: `login.title`, `login.baseUrl`, `login.username`, `login.password`, `login.submit`, `login.cleartextWarning`, `experts.title`, `tasks.title`, `tasks.new`, `chat.stop`, `chat.working`, `chat.disconnected`, `chat.retry`, `settings.title`, `settings.logout`, `errors.unauthorized`, `errors.network`, `about.unofficial`.

- [ ] **Step 4: Commit**

```bash
git add src/storage src/i18n
git commit -m "feat: add secure storage and zh/en i18n helpers"
```

---

### Task 3: HTTP client + auth/agents/threads API

**Files:**
- Create: `src/api/types.ts`, `src/api/http.ts`, `src/api/auth.ts`, `src/api/agents.ts`, `src/api/threads.ts`
- Test: `__tests__/api/http.test.ts`

**Interfaces:**
- Consumes: `getBaseUrl`, `getToken`, `setToken`, `clearToken`
- Produces:
  - `apiRequest<T>(path, init): Promise<T>`
  - `login(username, password): Promise<LoginResponse>`
  - `logout(): Promise<void>`
  - `listAgents(): Promise<Agent[]>`
  - `listThreads(agentId): Promise<ThreadSummary[]>`
  - `createThread(agentId): Promise<{thread_id: string; session_key: string}>`
  - `getThreadHistory(agentId, threadId, opts?): Promise<HistoryResponse>`

- [ ] **Step 1: Write failing test for sliding token + 401**

```typescript
// __tests__/api/http.test.ts
import { createApiClient } from "../../src/api/http";

test("replaces token when X-Octop-Access-Token present", async () => {
  const tokens: string[] = ["old"];
  const client = createApiClient({
    getBaseUrl: async () => "https://octop.example",
    getToken: async () => tokens[0] ?? null,
    setToken: async (t) => {
      tokens[0] = t;
    },
    clearToken: async () => {
      tokens.length = 0;
    },
    fetchImpl: async () =>
      new Response("{}", {
        status: 200,
        headers: { "X-Octop-Access-Token": "new", "Content-Type": "application/json" },
      }),
  });
  await client.apiRequest("/api/auth/me");
  expect(tokens[0]).toBe("new");
});

test("clears token and throws unauthorized on 401", async () => {
  let cleared = false;
  const client = createApiClient({
    getBaseUrl: async () => "https://octop.example",
    getToken: async () => "x",
    setToken: async () => {},
    clearToken: async () => {
      cleared = true;
    },
    fetchImpl: async () => new Response("{}", { status: 401 }),
  });
  await expect(client.apiRequest("/api/agents")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(cleared).toBe(true);
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/api/http.test.ts -v
```

- [ ] **Step 3: Implement `createApiClient`**

```typescript
// src/api/http.ts (sketch)
export type ApiError = { code: "UNAUTHORIZED" | "NETWORK" | "HTTP"; status?: number; message: string };

export function createApiClient(deps: {
  getBaseUrl: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
  setToken: (t: string) => Promise<void>;
  clearToken: () => Promise<void>;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const base = await deps.getBaseUrl();
    if (!base) throw { code: "HTTP", message: "missing base url" } satisfies ApiError;
    const token = await deps.getToken();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    let res: Response;
    try {
      res = await fetchImpl(`${base}${path}`, { ...init, headers });
    } catch {
      throw { code: "NETWORK", message: "network error" } satisfies ApiError;
    }
    const renewed = res.headers.get("X-Octop-Access-Token");
    if (renewed) await deps.setToken(renewed);
    if (res.status === 401) {
      await deps.clearToken();
      throw { code: "UNAUTHORIZED", status: 401, message: "unauthorized" } satisfies ApiError;
    }
    if (!res.ok) {
      const text = await res.text();
      throw { code: "HTTP", status: res.status, message: text || res.statusText } satisfies ApiError;
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
  return { apiRequest };
}
```

- [ ] **Step 4: Implement resource modules**

```typescript
// src/api/auth.ts
export function login(api: { apiRequest: Function }, username: string, password: string) {
  return api.apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
```

```typescript
// src/api/agents.ts — GET /api/agents (scope=mine default)
// src/api/threads.ts —
//   GET  /api/agents/{id}/threads?limit=50
//   POST /api/agents/{id}/threads
//   GET  /api/agents/{id}/threads/{threadId}/history?limit=25&offset=0
```

Types must match `docs/api-contract.md` (`agent_id`, `thread_id`, history `messages` / `turn_active` / `history_loading`).

- [ ] **Step 5: Run tests — expect PASS**

```bash
npx jest __tests__/api/http.test.ts -v
```

- [ ] **Step 6: Commit**

```bash
git add src/api __tests__/api
git commit -m "feat: add Octop HTTP client with sliding token and 401 handling"
```

---

### Task 4: Auth context, login, settings, navigation gate

**Files:**
- Create: `src/features/auth/AuthContext.tsx`, `app/(auth)/login.tsx`, `app/settings.tsx`, `src/components/HeaderGear.tsx`, `src/components/ErrorBanner.tsx`
- Modify: `app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: auth API, storage, i18n
- Produces: `useAuth()` → `{ status, user, baseUrl, signIn, signOut, setBaseUrl }`

- [ ] **Step 1: AuthProvider**

On mount: load base URL + token; if token, `GET /api/auth/me`; on failure clear token. Expose `signIn` that:

1. Normalizes base URL and saves it  
2. If `http://` and not ack’d → show one-time warning; on accept set ack  
3. `POST /api/auth/login` → `setToken(access_token)`  
4. Navigate to tabs  

`signOut`: best-effort `POST /api/auth/logout`, then `clearToken`, keep base URL.

- [ ] **Step 2: Login screen**

Fields: base URL, username, password. Disable submit while pending. Map `UNAUTHORIZED`/`AUTH` errors to i18n strings. Show unofficial subtitle.

- [ ] **Step 3: Root navigation**

- Unauthenticated → `(auth)/login`  
- Authenticated → `(tabs)`  
- `settings` as stack screen outside tabs  
- `HeaderGear` on Experts/Tasks headers → `router.push("/settings")`

- [ ] **Step 4: Settings**

Show base URL (read-only or editable with re-login), user name, Logout, About unofficial blurb.

- [ ] **Step 5: Manual check**

Against a real Octop instance: login → tabs → settings → logout → login form still has base URL.

- [ ] **Step 6: Commit**

```bash
git add app src/features/auth src/components
git commit -m "feat: add login, settings, and auth-gated navigation"
```

---

### Task 5: Experts tab + selected agent

**Files:**
- Create: `src/features/agents/AgentContext.tsx`, `app/(tabs)/experts/index.tsx`
- Modify: persist `selectedAgentId`

**Interfaces:**
- Consumes: `listAgents`
- Produces: `useSelectedAgent()` → `{ agents, selectedAgentId, selectAgent, refresh }`

- [ ] **Step 1: Fetch and render agent list**

Show `name`, optional `description`, `unread_count` badge. Tap → `selectAgent(agent_id)` + navigate to Tasks tab.

- [ ] **Step 2: Empty / error states**

Empty: “No agents — create one in the Octop web UI.” Error banner with retry.

- [ ] **Step 3: Manual check**

Login → Experts shows agents from `/api/agents`.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/experts src/features/agents
git commit -m "feat: add Experts tab with agent selection"
```

---

### Task 6: Tasks tab — thread list + create

**Files:**
- Create: `app/(tabs)/tasks/index.tsx`
- Modify: require `selectedAgentId` (redirect to Experts if missing)

**Interfaces:**
- Consumes: `listThreads`, `createThread`, selected agent

- [ ] **Step 1: List threads for selected agent**

Display `title` or fallback `thread_id` slice; `last_active`; pin indicator if `pinned`. Tap → `/tasks/[threadId]`.

- [ ] **Step 2: New thread button**

`POST /api/agents/{id}/threads` → navigate to new `thread_id`.

- [ ] **Step 3: Manual check**

Create thread → appears in list → opens chat screen stub.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/tasks
git commit -m "feat: add per-agent thread list and create"
```

---

### Task 7: Chat WebSocket client + streaming UI + Stop

**Files:**
- Create: `src/api/chatWs.ts`, `src/features/chat/useChatTurn.ts`, `app/(tabs)/tasks/[threadId].tsx`, `src/components/MarkdownBubble.tsx`, `src/components/WorkingIndicator.tsx`
- Test: `__tests__/api/chatWs.url.test.ts`

**Interfaces:**
- Consumes: base URL, token, `getThreadHistory`
- Produces:
  - `buildChatWsUrl(baseUrl, agentId, token): string`
  - `useChatTurn({ agentId, threadId })` → `{ messages, streamingText, working, send, stop, reconnect, error }`

- [ ] **Step 1: Failing test for WS URL**

```typescript
import { buildChatWsUrl } from "../../src/api/chatWs";

test("maps https base to wss path with token query", () => {
  expect(buildChatWsUrl("https://octop.example", "agent-1", "jwt")).toBe(
    "wss://octop.example/api/agents/agent-1/chat/ws?token=jwt",
  );
});

test("maps http base to ws", () => {
  expect(buildChatWsUrl("http://192.168.1.5:8000", "a", "t")).toBe(
    "ws://192.168.1.5:8000/api/agents/a/chat/ws?token=t",
  );
});
```

- [ ] **Step 2: Implement WS helpers**

```typescript
// src/api/chatWs.ts
export function buildChatWsUrl(baseUrl: string, agentId: string, token: string): string {
  const wsBase = baseUrl.startsWith("https://")
    ? "wss://" + baseUrl.slice(8)
    : "ws://" + baseUrl.slice(7);
  return `${wsBase}/api/agents/${encodeURIComponent(agentId)}/chat/ws?token=${encodeURIComponent(token)}`;
}
```

Open socket; send JSON frames; parse inbound. On unexpected close while foregrounded: **one** reconnect, then `subscribe` if `threadId` set.

- [ ] **Step 3: History load**

On screen focus: `getThreadHistory`. If `history_loading`, wait `history_retry_after_ms` and retry (cap ~10). If `turn_active`, connect WS + `subscribe`. Flatten message `content` string | text blocks into display rows (`role: user|assistant`).

- [ ] **Step 4: Send + stream**

Composer TextInput + Send → `{ type:"user_turn", text, thread_id }`. On `token` append to `streamingText`. On unknown types set `working=true`. On `done`/`error` finalize bubble; clear working.

- [ ] **Step 5: Stop button**

Visible while turn active → `{ type:"cancel", thread_id }`.

- [ ] **Step 6: MarkdownBubble**

Use `react-native-markdown-display` with styles for headings/lists/code/links only.

- [ ] **Step 7: Disconnect banner**

If socket dead: banner + Retry calling reconnect.

- [ ] **Step 8: Manual smoke (contract §6)**

Login → agent → new thread → send message → see tokens → Stop mid-turn on a long reply → history reload shows content.

- [ ] **Step 9: Commit**

```bash
git add src/api/chatWs.ts src/features/chat app/(tabs)/tasks/[threadId].tsx src/components __tests__/api/chatWs.url.test.ts
git commit -m "feat: streaming chat over Octop WS with cancel and markdown"
```

---

### Task 8: Polish gates — About, README, smoke script notes

**Files:**
- Modify: `README.md`, `app/settings.tsx` (About), optionally `scripts/smoke-checklist.md`

- [ ] **Step 1: README**

Update status to Phase 1 in progress / MVP; link spec + `docs/api-contract.md`; document pinned Octop `v0.9.32`; cleartext LAN warning; smoke path from contract §6.

- [ ] **Step 2: In-app About**

Exact line: “Unofficial companion for self-hosted Octop”.

- [ ] **Step 3: Run unit tests**

```bash
npx jest
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md app/settings.tsx
git commit -m "docs: pin Octop v0.9.32 and document MVP smoke path"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Expo Router stack+tabs | 1, 4 |
| Settings base URL + login/logout | 4 |
| Experts = `/api/agents` only | 5 |
| Tasks = per-agent threads | 6 |
| History HTTP + WS stream | 7 |
| WS `?token=` auth | 7 |
| Cancel supported | 7 |
| Basic markdown | 7 |
| 401 → login, keep base URL | 3, 4 |
| Sliding `X-Octop-Access-Token` | 3 |
| Cleartext warning | 4 |
| zh/en | 2 |
| Online-only + one reconnect | 7 |
| Unofficial labeling | 8 |
| Pin + api-contract | Phase 0 done; README in 8 |
| No Knowledge/Automation tabs | 1 |

## Placeholder / self-review notes

- No TBD steps remain for MVP scope.
- HITL / tool cards / attachments intentionally omitted.
- Health has no `version` at pin — do not implement fake version gating.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-11-octop-mobile-mvp.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
**2. Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
