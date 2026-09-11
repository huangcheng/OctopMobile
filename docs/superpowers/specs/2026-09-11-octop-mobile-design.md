# OctopMobile — Design Spec

**Date:** 2026-09-11  
**Status:** Draft for review  
**Owner:** huangcheng (independent; not TencentCloud org)  
**Repo (planned):** https://github.com/huangcheng/OctopMobile  
**Related:** [TencentCloud/Octop#638](https://github.com/TencentCloud/Octop/issues/638) (mobile client wish); bonus / extension only  

---

## 1. Purpose

OctopMobile is an **unofficial, optional mobile client** for self-hosted [Octop](https://github.com/TencentCloud/Octop). It is a **bonus / extension** project: Octop’s primary surfaces remain the web dashboard, PWA, desktop shell, and IM channels.

The product bar is **WorkBuddy-class limited features** — chat-centric mobile UX — **not** a 1:1 port of the Octop web console.

### Success criteria (v1)

- A user can point the app at their Octop base URL, sign in, pick an expert/agent, and complete a streaming chat turn on a phone.
- The project is clearly labeled third-party / unofficial.
- Maintenance stays low: web console features are **not** tracked 1:1.

### Non-goals (v1)

- Packaging or shipping the Octop server inside the app (no “green zip” / Wails-style local server).
- Full admin: TLS, storage backends, connector OAuth deep flows, security policies.
- Workspace dock, remote browser, remote desktop/phone control, trajectory inspector.
- Replacing PWA or IM as the default mobile path.
- Official TencentCloud branding or App Store listing under the org.

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

### 4.1 Information architecture (WorkBuddy-inspired)

Bottom tabs (v1 may ship a subset):

| Tab | v1 intent | Octop backend |
|-----|-----------|---------------|
| **任务 (Tasks)** | Thread / conversation list + chat | Agents + threads + chat WS |
| **专家 (Experts)** | Browse / select agents (and/or published experts) | `/api/agents`, experts catalog as available |
| **资料库 (Knowledge)** | List KBs; open doc **later** | Knowledge base list APIs |
| **自动化 (Automation)** | Optional light cron list | Cron APIs — **post-MVP** |
| **项目 (Projects)** | Out of scope unless needed | — |

**MVP (must ship first):** Settings (base URL + login) → Experts → Tasks/Chat streaming.  
**Stretch after MVP:** Knowledge list; Automation read-only; attachments; citation chips.

### 4.2 Chat MVP capabilities

- List threads for the selected agent  
- Send user message; consume **WebSocket** chat stream (`/api/agents/{id}/chat/ws`)  
- Render assistant markdown (basic)  
- Cancel / stop turn if API supports it  
- Persist JWT securely on device  

### 4.3 Explicitly deferred

- Tool cards parity with web (trajectory, browser dock, HITL rich UI)  
- Knowledge rich preview (PDF/Office) — defer; deep-link to PWA or later WebView  
- Voice input (nice-to-have after text chat works)  
- Push notifications  
- Multi-account profiles (single base URL + user is enough for v1)

---

## 5. Technical design

### 5.1 Stack

- **Expo** (managed workflow) + TypeScript  
- React Navigation (tabs + stack)  
- Secure storage for tokens (`expo-secure-store`)  
- Config: `EXPO_PUBLIC_DEFAULT_BASE_URL` optional; user-editable base URL required for self-host  

### 5.2 Backend contract

- Consume Octop **public HTTP API** + agent chat **WebSocket** as documented in Octop `docs/api.md` / `/api/openapi.json`.  
- Auth: `POST /api/auth/login` → Bearer JWT on subsequent calls.  
- Do **not** depend on private forks or undocumented internals.  
- Compatibility: target current Octop `develop` / recent release; document minimum version when known.

### 5.3 App structure (planned)

```
OctopMobile/
  docs/superpowers/specs/   ← this document
  docs/superpowers/plans/   ← implementation plan (after spec approval)
  app/                      ← Expo Router screens (when scaffolded)
  src/
    api/                    ← fetch + WS client
    features/               ← auth, agents, chat, knowledge
    components/
  README.md
```

Web dashboard code from `TencentCloud/Octop/dashboard` is **not** imported. Shared ideas only (error codes, citation marker format) may be copied or extracted later into a tiny shared package — YAGNI until duplication hurts.

### 5.4 Self-hosted connectivity

- User enters base URL (e.g. `https://octop.example.com`).  
- App strips trailing slash; calls `{base}/api/...`.  
- Clear errors for TLS failures, wrong URL, 401.  
- HTTP cleartext: follow Expo / OS rules (dev may allow; production prefer HTTPS).

### 5.5 Platform

- iOS + Android via Expo.  
- No requirement to ship to App Store in v0; internal / TestFlight / APK is enough for a bonus project.

---

## 6. Branding & compliance

- README and in-app About: **“Unofficial companion for self-hosted Octop”**.  
- Do not claim TencentCloud official status.  
- Respect Octop license when redistributing trademarks/logos; prefer original app icon/name styling for OctopMobile.  
- Issue #638 is inspiration only; this repo does not automatically close upstream issues unless maintainers adopt it.

---

## 7. Delivery phases

| Phase | Outcome |
|-------|---------|
| **0 — Spec + repo** | This doc; empty/local project; GitHub `huangcheng/OctopMobile` |
| **1 — MVP** | Base URL, login, agent list, thread list, streaming chat |
| **2 — Polish** | Markdown quality, errors/i18n (zh/en), empty states, basic settings |
| **3 — Stretch** | Knowledge list; attachments; optional automation list |
| **4 — Optional** | Store listing; push; WebView for heavy previews |

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| API drift vs Octop web | Pin tested Octop version; read OpenAPI; keep client thin |
| WS / background on iOS | Foreground chat first; document limits |
| Scope creep toward full console | Enforce non-goals; bonus framing |
| Dual maintenance | Ship slow; prefer cutting features over parity |

---

## 9. Open questions

Resolved in prior discussion unless marked:

| Question | Decision |
|----------|----------|
| Wrapper vs rewrite? | Rewrite limited surface (Expo) |
| New repo vs inside Octop? | Separate project under personal account |
| Official org? | No — independent bonus |
| Name? | `OctopMobile` (`huangcheng/OctopMobile`) |

Still open (can default):

1. **Default language:** device locale with zh/en strings? (Recommend: yes)  
2. **GitHub visibility:** public vs private for early work? (Recommend: public once MVP runs)  
3. **Expert = agent list only, or also expert marketplace?** (Recommend: agent list for MVP)

---

## 10. Approval

Please review this spec. After approval:

1. Implementation plan → `docs/superpowers/plans/2026-09-11-octop-mobile-mvp.md`  
2. Scaffold Expo app and start Phase 1  

Do **not** treat Phase 1 as “build all five WorkBuddy tabs.”
