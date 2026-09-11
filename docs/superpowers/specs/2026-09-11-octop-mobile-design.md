# OctopMobile — Design Spec

**Date:** 2026-09-11  
**Status:** Draft for review (audit fixes applied)  
**Owner:** huangcheng (independent; not TencentCloud org)  
**Repo (planned):** https://github.com/huangcheng/OctopMobile  
**Related:** [TencentCloud/Octop#638](https://github.com/TencentCloud/Octop/issues/638) (mobile client wish); bonus / extension only  

**v1 boundary:** Phase 1 (MVP) + Phase 2 (polish). Stretch items are Phase 3+.

---

## 1. Purpose

OctopMobile is an **unofficial, optional mobile client** for self-hosted [Octop](https://github.com/TencentCloud/Octop). It is a **bonus / extension** project: Octop’s primary surfaces remain the web dashboard, PWA, desktop shell, and IM channels.

The product bar is **WorkBuddy-class limited features** — chat-centric mobile UX — **not** a 1:1 port of the Octop web console.

### Success criteria (v1)

- A user can point the app at their Octop base URL, sign in, pick an agent, and complete a streaming chat turn on a phone.
- The project is clearly labeled third-party / unofficial.
- Maintenance stays low: web console features are **not** tracked 1:1.

### Non-goals (v1)

- Packaging or shipping the Octop server inside the app (no “green zip” / Wails-style local server).
- Full admin: TLS, storage backends, connector OAuth deep flows, security policies.
- Workspace dock, remote browser, remote desktop/phone control, trajectory inspector.
- Replacing PWA or IM as the default mobile path.
- Official TencentCloud branding or App Store listing under the org.
- Offline-capable chat (app is online-only; show disconnected banner + retry).
- Inbound deep links / universal links (outbound open-in-browser to PWA is enough when needed).
- SSO / OIDC login (v1 is password login via `POST /api/auth/login` only).

---

## 2. Positioning vs other clients

| Client | Role |
|--------|------|
| Octop web / PWA | Full product; source of truth for features |
| Octop desktop (Wails) | Thin native shell around local/server web UI |
| [OctopPet](https://github.com/jubaoliang/OctopPet) | Unrelated desktop pet |
| **OctopMobile** | Native-feeling **limited** mobile app (Expo); API consumer only |

---

## 3. Approaches considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A. Expo WebView wrapping dashboard** | Fast; reuses UI | Desktop-shaped UI; poor WorkBuddy fit | Reject for primary UX |
| **B. Expo / RN rewrite of a limited surface** | Mobile IA; good chat UX | Duplicate chat UI maintenance | **Chosen** |
| **C. Capacitor shell of mobile-tuned web** | Closer to Electron | Still web layout debt; less “app” feel | Fallback / later hybrid only |

**Choice:** **B** — Expo (React Native) app with a **small feature set**, talking to existing Octop HTTP/WS APIs. Complex previews (e.g. PDF) may use an in-app WebView **later** as an escape hatch, not as the whole app.

---

## 4. Product scope

### 4.1 Information architecture

**Phase 1 ships exactly:**

| Surface | Role | Backend |
|---------|------|---------|
| **Settings** (stack screen, not a bottom tab) | Base URL + login / logout; first-run entry; after login, reachable via header gear on Experts/Tasks | `POST /api/auth/login` |
| **专家 (Experts)** tab | Browse / select agents (`/api/agents` only) | `/api/agents` |
| **任务 (Tasks)** tab | Thread list **for the selected agent** + chat | Threads API + chat WS |

Do **not** render Knowledge / Automation / Projects tabs (or disabled placeholders) in Phase 1–2.

| Later surface | When | Backend |
|---------------|------|---------|
| **资料库 (Knowledge)** | Phase 3 | Knowledge base list APIs |
| **自动化 (Automation)** | Phase 3 (read-only) | Cron APIs |
| **项目 (Projects)** | Out of scope unless needed | — |

**MVP (must ship first):** Settings (base URL + login) → Experts → Tasks/Chat streaming.  
**Stretch (Phase 3+):** Knowledge list; Automation read-only; attachments; citation chips.

### 4.2 Chat MVP capabilities

- List threads **scoped to the selected agent** (prefer server-side filter; fall back to client filter with a documented cap if the API is global-only — confirm in pre-plan spike).
- Load historical messages for a thread via HTTP when opening it (exact endpoint confirmed in spike).
- Send user message; consume **WebSocket** chat stream (`/api/agents/{id}/chat/ws` or the path documented for the pinned Octop version).
- **WS auth:** document and implement the mechanism verified in the spike (query token, first-message auth, or header-capable polyfill). RN’s default `WebSocket` cannot set `Authorization` headers — treat this as a Phase 0/1 spike gate.
- **WS resilience:** foreground chat only; on disconnect, one auto-reconnect attempt while foregrounded; on failure show a retry banner. No background reconnect. Non-text stream events (tool/status): show a minimal “working…” indicator only; no tool-card parity.
- Render assistant markdown (**basic** = headings, emphasis, lists, inline + fenced code, links; **not** tables, math, or raw HTML).
- **Cancel / stop turn:** include only if the spike confirms a supported API; otherwise omit the control (no dead button).
- Persist JWT in `expo-secure-store`.
- **Auth lifecycle:** password login only in v1. On any 401: clear stored token, route to login, **preserve last base URL**. No silent refresh in v1. Explicit logout clears the token.

### 4.3 Explicitly deferred

- Tool cards parity with web (trajectory, browser dock, HITL rich UI)  
- Knowledge rich preview (PDF/Office) — defer; open in system browser / PWA or later WebView  
- Unified cross-agent inbox (Tasks stays per-selected-agent)  
- Voice input (nice-to-have after text chat works)  
- Push notifications  
- Multi-account profiles (single base URL + user is enough for v1)  
- Offline / local message cache  
- Inbound deep links / universal links  
- SSO / OIDC and other non-password auth providers  
- Telemetry / third-party analytics SDKs (none in v1)

---

## 5. Technical design

### 5.1 Stack

- **Expo** (managed workflow) + TypeScript  
- **Expo Router** (file-based `app/` routes; tabs + stack) — not a separate React Navigation-only setup  
- Secure storage for tokens (`expo-secure-store`)  
- Config: `EXPO_PUBLIC_DEFAULT_BASE_URL` optional; user-editable base URL required for self-host  
- i18n: device locale with **zh/en** strings from Phase 1 (strings ship early; polish empty states in Phase 2)

### 5.2 Backend contract

- Consume Octop **public HTTP API** + agent chat **WebSocket** as documented in Octop `docs/api.md` / `/api/openapi.json`.  
- Auth: `POST /api/auth/login` → Bearer JWT on subsequent HTTP calls; WS auth per spike (§4.2).  
- Do **not** depend on private forks or undocumented internals.  
- **Compatibility:** pin a **tested Octop release or commit during Phase 0** (record in README + `docs/api-contract.md`: endpoints, request/response shapes, WS event types, auth handshake, thread scoping, history endpoint, cancel support). Tracking `develop` is maintenance, not the build target. Soft-warn in-app when server identity is available and below the pinned minimum (health/`version` if present; otherwise document “no runtime version probe” for the pinned release).

### 5.3 App structure (planned)

```
OctopMobile/
  docs/superpowers/specs/   ← this document
  docs/superpowers/plans/   ← implementation plan (after spec approval)
  docs/api-contract.md      ← pinned Octop version + endpoint/WS appendix (from spike)
  app/                      ← Expo Router screens
  src/
    api/                    ← fetch + WS client
    features/               ← auth, agents, chat, knowledge
    components/
  README.md
```

Web dashboard code from `TencentCloud/Octop/dashboard` is **not** imported. Shared ideas only (error codes, citation marker format) may be copied or extracted later into a tiny shared package — YAGNI until duplication hurts.

### 5.4 Self-hosted connectivity

- User enters base URL (e.g. `https://octop.example.com` or `http://192.168.x.x:port` for LAN).  
- App strips trailing slash; calls `{base}/api/...`.  
- Clear errors for TLS failures, wrong URL, 401.  
- **HTTP cleartext:** allow `http://` with a **one-time in-app warning** (self-hosters often use LAN IPs). Enable cleartext traffic where the OS requires an explicit allowlist (iOS ATS / Android `usesCleartextTraffic`) so LAN HTTP works.  
- **Self-signed TLS:** do **not** bypass certificate validation; show a clear error with guidance to use a trusted cert or HTTP on LAN.  
- Online-only: when unreachable, show disconnected banner + retry (no offline queue).

### 5.5 Platform & testing

- iOS + Android via Expo.  
- No requirement to ship to App Store in v0; internal / TestFlight / APK is enough for a bonus project.  
- **Testing (minimum):** one contract smoke path against the pinned Octop instance — login → agent list → open/create thread → one streaming WS turn — run manually (or scripted) before each release cut. Unit-test the API/WS client parsing where cheap.

---

## 6. Branding & compliance

- README and in-app About: **“Unofficial companion for self-hosted Octop”**.  
- Do not claim TencentCloud official status.  
- Respect Octop license when redistributing trademarks/logos; prefer original app icon/name styling for OctopMobile.  
- Issue #638 is inspiration only; this repo does not automatically close upstream issues unless maintainers adopt it.  
- No analytics / third-party telemetry SDKs in v1 (JWT stays on-device except requests to the user’s Octop base URL).

---

## 7. Delivery phases

| Phase | Outcome |
|-------|---------|
| **0 — Spec + repo + API spike** | This doc; repo; `docs/api-contract.md` for a pinned Octop version (incl. WS auth) |
| **1 — MVP** | Base URL, password login/logout, agent list, per-agent threads, streaming chat, zh/en strings |
| **2 — Polish** | Markdown quality, richer errors/empty states, settings polish |
| **3 — Stretch** | Knowledge list; attachments; optional automation list |
| **4 — Optional** | Store listing; push; WebView for heavy previews |

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| API drift vs Octop web | Pin tested Octop version in README + `docs/api-contract.md`; keep client thin |
| WS auth / RN header limits | Spike before scaffold; document handshake in contract appendix |
| WS / background on iOS | Foreground chat first; one reconnect; retry banner; document limits |
| Scope creep toward full console | Enforce non-goals; bonus framing; no extra tabs in Phase 1–2 |
| Dual maintenance | Ship slow; prefer cutting features over parity |

---

## 9. Decisions

| Question | Decision |
|----------|----------|
| Wrapper vs rewrite? | Rewrite limited surface (Expo + Expo Router) |
| New repo vs inside Octop? | Separate project under personal account |
| Official org? | No — independent bonus |
| Name? | `OctopMobile` (`huangcheng/OctopMobile`) |
| Default language? | Device locale with zh/en strings from Phase 1 |
| GitHub visibility? | Public once MVP runs (private OK during spike) |
| Experts surface? | `/api/agents` list only for MVP; no marketplace |
| Cleartext HTTP? | Allow with one-time warning; no cert-validation bypass |
| Offline / deep links / SSO? | Deferred (§1 non-goals, §4.3) |

---

## 10. Approval

Please review this spec. After approval:

1. **Phase 0 spike** → pin Octop version + write `docs/api-contract.md` (HTTP + WS auth/events; cancel support yes/no; thread scoping; history endpoint).  
2. Implementation plan → `docs/superpowers/plans/2026-09-11-octop-mobile-mvp.md`  
3. Scaffold Expo Router app and start Phase 1  

Do **not** treat Phase 1 as “build all five WorkBuddy tabs.”
