# OctopMobile — API Contract (pinned)

**Pinned Octop:** `v0.9.32`  
**Commit:** `deb7ac81e89b8779fec59378684582efcde70d43`  
**Sources:** `TencentCloud/Octop` tag `v0.9.32` — `docs/api.md`, `src/octop/api/routers/{auth,agents,chat,health}.py`, `tests/integration/test_chat_ws.py`  
**Spike date:** 2026-09-11  

> Prefer **source + integration tests** over `docs/api.md` when they disagree. At this pin, `docs/api.md` still documents legacy `/agents/{id}/chat/sessions*` paths; the live routers use `/agents/{id}/threads*`.

---

## 1. Base URL & transport

- User-configured base URL, trailing slash stripped.
- HTTP API: `{base}/api/...`
- Chat WebSocket: `{wsBase}/api/agents/{agent_id}/chat/ws?token={jwt}`
  - `wsBase` = `https` → `wss`, `http` → `ws`
- JSON request/response unless noted.
- Authenticated HTTP: `Authorization: Bearer <access_token>`

### Cleartext / TLS (client policy)

- Allow `http://` with a one-time in-app warning (LAN self-host).
- Do **not** bypass TLS certificate validation for `https://`.

### Version probe

- `GET /api/health` (public) returns at this pin:
  ```json
  { "ok": true, "started_at": "...", "db": true, "users_loaded": 1, "agents_running": 0 }
  ```
- **No `version` field** in health at `v0.9.32`. Soft-warn on version mismatch is deferred until Octop exposes a usable version endpoint; pin is enforced by human process (README + this doc).

---

## 2. Auth

### `POST /api/auth/login` (public)

Body:

```json
{ "username": "alice", "password": "…" }
```

(`username` may be an email.)

Success `200`:

```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": 1,
    "username": "alice",
    "role": "user",
    "display_name": null,
    "locale": "zh-CN",
    "permissions": []
  }
}
```

Failure cases (non-exhaustive): invalid credentials → auth error; empty user DB → setup required (`503` / `setup_required` style).

### `POST /api/auth/logout` (user) → `204`

JWT is **not** server-revoked (stateless). Client must clear SecureStore.

### `GET /api/auth/me` (user)

Returns the `user` object shape above.

### Sliding renew (HTTP only)

When less than ~⅓ of TTL remains, authenticated responses may include:

`X-Octop-Access-Token: <new_jwt>`

**Client rule:** if the header is present, replace the stored access token. This is Octop’s sliding renew — not a separate refresh-token endpoint. On **401**, still clear token and return to login (preserve base URL).

### Out of scope for OctopMobile v1

- OIDC / SSO (`/api/auth/oidc/*`)
- Invite redeem
- Setup wizard (`/api/setup/*`) — assume server already bootstrapped

---

## 3. Agents (Experts tab)

### `GET /api/agents?scope=mine` (user) — **MVP**

Default `scope=mine`: agents owned by the user plus agents shared with them.

Useful fields:

| Field | Notes |
|-------|--------|
| `agent_id` | Stable id used in all other paths |
| `id` | Numeric row id |
| `name`, `description`, `icon`, `icon_url`, `color` | Display |
| `state` | Runtime state string |
| `unread_count` | Badge |
| `is_owner`, `is_shared`, `owner_username` | Sharing UI (optional in MVP) |
| `bootstrap_pending` | Agent still starting |

**MVP:** list + select only. No create/delete/admin.

---

## 4. Threads (Tasks tab) — **server-scoped to agent**

Threads are listed **per `agent_id` + current user** on the server. No client-side cross-agent filter needed. Default `limit=50`.

### `GET /api/agents/{agent_id}/threads?limit=50`

Item shape (abbreviated):

```json
{
  "thread_id": "…",
  "title": "…",
  "session_key": "…",
  "last_active": "…",
  "created_at": "…",
  "is_active": true,
  "has_messages": true,
  "pinned": false,
  "model_ref": null,
  "reasoning_mode": null,
  "reasoning_effort": null,
  "artifacts": []
}
```

### `POST /api/agents/{agent_id}/threads` → `201`

```json
{ "thread_id": "…", "session_key": "…" }
```

Creates a new dashboard thread (`/new` equivalent).

### `GET /api/agents/{agent_id}/threads/{thread_id}/history?limit=25&offset=0`

```json
{
  "thread_id": "…",
  "messages": [ /* see below */ ],
  "has_more": false,
  "limit": 25,
  "offset": 0,
  "history_loading": false,
  "history_status": "ready",
  "history_retry_after_ms": 0,
  "turn_active": false,
  "hitl_pending": null,
  "artifacts": []
}
```

**Client rules:**

- If `history_loading` is true, poll again after `history_retry_after_ms` (default 1500).
- If `turn_active` is true after open, open WS and send `subscribe` for that `thread_id`.
- `hitl_pending`: **ignore UI for v1** (no HITL cards); user can continue on web/PWA.

**Message entries:** `{ role, content, … }` where `content` may be a **string** or a **list of blocks**. MVP renderer: flatten text blocks; ignore tool / image-only noise for display.

History limits: default **25**, max **200**.

### Optional MVP+

- `PATCH /api/agents/{agent_id}/threads/{thread_id}` — rename / pin  
- `DELETE /api/agents/{agent_id}/threads/{thread_id}` — archive  

---

## 5. Chat WebSocket

### URL & auth

```
WS /api/agents/{agent_id}/chat/ws?token=<access_token>
```

- **Auth mechanism:** query param `token` (works with React Native’s stock `WebSocket`; no custom headers required).
- Missing/invalid token → close `4001`.
- Forbidden agent → close `4003`; not found → `4404`.

**Security note:** JWT appears in the URL. Prefer HTTPS/`wss` in production; on LAN HTTP accept the warning. Do not log full WS URLs.

### Client → server frames

| type | Body | Behavior |
|------|------|----------|
| `user_turn` | `{ "type":"user_turn", "text":"…", "thread_id"?: "…" }` | Start / continue a turn. Omit `thread_id` only when intentionally creating/reusing server default session; **MVP always passes `thread_id`** after create/list. |
| `ping` | `{ "type":"ping" }` | → `{ "type":"pong" }` |
| `subscribe` | `{ "type":"subscribe", "thread_id":"…" }` | Attach to in-flight turn without cancelling; → `turn_status` |
| `cancel` | `{ "type":"cancel", "thread_id":"…" }` | **Supported** — stops active turn. Disconnect alone does **not** cancel. |

Shorthand: raw non-JSON text is treated as `user_turn` text (prefer JSON).

### Server → client frames (MVP handling)

| type | Client action |
|------|----------------|
| `token` | Append `content` (string) to the streaming assistant bubble |
| `done` | Finalize turn; stop spinner |
| `error` | Show `message`; often followed by `done` |
| `turn_status` | `{ thread_id, active }` — update UI |
| `pong` | Heartbeat OK |
| other (`tool_*`, status, thinking, …) | Feed process card / “working…”; **do not** dump raw tool JSON in the transcript |

Harness may emit additional chunk types; treat unknown types as non-fatal “working…” signals until `done`/`error`.

### Reconnect (app policy)

- Foreground only; **one** auto-reconnect attempt on unexpected close.
- On success: if a thread is open and may be active, send `subscribe` with that `thread_id`.
- On failure: retry banner.
- No background reconnect (iOS).

### Cancel in MVP

**Yes — ship a Stop control** that sends `{ "type":"cancel", "thread_id" }` while a turn is active.

---

## 6. Smoke path (release gate)

Against a live Octop `v0.9.32` (or later **compatible** release after re-verifying this doc):

1. `GET /api/health` → `ok: true`
2. `POST /api/auth/login` → store `access_token`
3. `GET /api/agents` → pick `agent_id`
4. `POST /api/agents/{id}/threads` → `thread_id`
5. Open WS with `?token=`
6. Send `user_turn` with `text` + `thread_id`
7. Receive ≥1 `token` then `done`
8. `GET .../threads/{thread_id}/history` → messages include the turn
9. (Optional) second turn + `cancel` while streaming

---

## 7. Spike resolutions (spec open items)

| Question | Resolution at pin |
|----------|-------------------|
| WS auth | Query `token` |
| Cancel / stop | Supported via WS `cancel` |
| Thread scoping | Server-side per agent + user (`GET .../threads`) |
| History endpoint | `GET /api/agents/{id}/threads/{thread_id}/history` |
| `/chat/sessions` in api.md | **Stale** — use `/threads` |
| Health version field | Absent at this pin |

---

## 8. Re-pin checklist

When moving the pin forward:

1. Diff `docs/api.md` + `src/octop/api/routers/chat/{ws,history,models}.py` + `auth.py`
2. Re-run smoke path
3. Update tag/commit header in this file and README
4. Re-verify §9 paths (`knowledge-bases`, `cron`, `proactive-care`) against live routers

---

## 9. Knowledge, automation & proactive care (mobile redesign)

Used by the Ardot redesign tabs (Knowledge / Automation) and Settings notifications. Shapes below match the mobile client (`src/api/{knowledge,cron,proactiveCare}.ts`). Prefer live Octop routers over stale docs when they disagree; re-check on re-pin.

### Knowledge

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/knowledge-bases` | Bases visible to the current user |
| `GET` | `/api/knowledge-bases/{kb_id}/documents` | Document rows for one base |

`KnowledgeBase` (client): `id`, `name`, optional `description`, `doc_count` / `document_count`, `shared`, timestamps as provided by server.

`KnowledgeDocument` (client): `id`, `title` / `name`, optional `status`, `updated_at`.

### Cron / automation

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/agents/{agent_id}/cron` | Jobs for an owned agent |
| `PATCH` | `/api/agents/{agent_id}/cron/{cron_id}` | Body `{ "enabled": boolean }` — design 13 toggle |
| `GET` | `/api/cron/settings` | Server timezone for Automation footer |

`CronJob` (client): `id`, `name` / `title`, `trigger` (cron / `interval:` / `date:`), `enabled`, optional `last_status`, `last_run_at`.

### Proactive care (Settings)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/agents/{agent_id}/proactive-care` | Current config for selected agent |
| `PUT` | `/api/agents/{agent_id}/proactive-care` | Save config (body = full `ProactiveCareConfig`) |

MVP UI only toggles `enabled` and persists the rest of the config object returned by GET.
