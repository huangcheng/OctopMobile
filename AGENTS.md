# AGENTS.md — OctopMobile

Unofficial Expo/React Native companion for self-hosted [Octop](https://github.com/TencentCloud/Octop). Personal project (`huangcheng`); **not** a TencentCloud product.

## Before you code

1. **Designs are the constitution** — Ardot file [`724619963379272`](https://ardot.tencent.com/file/724619963379272) is the single source of truth for every screen, layout, token, and component. Implementations must honor it; when code and designs disagree, **the designs win**. Offline snapshot: [docs/design/](docs/design/) (`screens/*.png` + `tokens.json` with Light & Dark modes) — re-export it after editing the Ardot file. Layout structure, spacing, radii, type scale, colors, and copy come from the frames; never invent screens or restyle on taste. Iterate visuals **in Ardot first**, then port to code (`.impeccable.md` for craft). Local Ardot MCP bridge: `.tmp/ardot_mcp.py` → `http://127.0.0.1:50501/api/v1/mcp` (`batch_read`, `capture_layout`, `fetch_variables`, …).
2. **Expo SDK 57** — read [Expo v57 docs](https://docs.expo.dev/versions/v57.0.0/) before writing Expo/RN APIs. This scaffold is Expo Router + tabs.
3. **Pinned Octop API** — honor [docs/api-contract.md](docs/api-contract.md) (`v0.9.32`). Prefer live routers/tests over stale Octop `docs/api.md` (threads ≠ legacy chat sessions). New endpoints must be verified against the pin and documented in the contract before wiring.
4. **Product boundary** — [docs/superpowers/specs/2026-09-11-octop-mobile-design.md](docs/superpowers/specs/2026-09-11-octop-mobile-design.md). Chat-centric companion, **not** a web-console port. Per the constitution the app ships 4 tabs — **Chats, Experts, Knowledge (read-only), Automation (read-only + enable toggle)** — plus login, expert detail, chat, new chat, settings. Console-only surfaces (KB create/upload, cron create, admin) deep-link to the web console.

## Layout

| Path | Role |
|------|------|
| `app/(auth)/login` | Login per design 01–02 (cleartext dialog) |
| `app/(tabs)/chats` | Conversation list (designs 03–07): greeting, Today/Earlier, thread actions sheet |
| `app/(tabs)/experts` | Experts list (designs 08–09): search, MY EXPERTS, Expert Market row |
| `app/(tabs)/knowledge` | Knowledge bases, read-only (designs 11–12) |
| `app/(tabs)/automation` | Cron jobs, read-only + toggle (designs 13–14) |
| `app/expert/[agentId]` | Expert detail (design 10) |
| `app/chat/[threadId]`, `app/chat/new` | Chat (designs 15–16), New chat (designs 17–18) |
| `app/settings` | Settings (design 19) |
| `src/api/` | HTTP client, auth/agents/threads, knowledge, cron, proactive-care, chat WebSocket |
| `src/features/` | Auth, selected agent, chat turn hook |
| `src/components/` | Design-system chrome: `PillTabBar`, `EmptyState`, `AgentTile`, `StatusPill`, `Fab`, `ActionSheet`, chat bubbles, banners |
| `src/utils/` | schedule/trigger formatting, time grouping, agent colors |
| `src/storage/` | SecureStore token + preferences |
| `src/i18n/` | `en` / `zh` strings |
| `assets/images/` | Logo + mascots from Octop dashboard `public/` (pin v0.9.32) |
| `docs/` | Spec, plan, API contract, design handoff (`design/`) |
| `__tests__/` | Jest (`ts-jest`, node env) — `npx jest` |
| `.maestro/` | Local Maestro E2E flows (when present) |

## Conventions

- **TypeScript:** `strict` on (`tsconfig.json`). Prefer explicit types at API/feature boundaries; avoid `any`.
- **Stack defaults:** Expo Router + React Native patterns already in-tree. No React Query / Zustand / XState / RxJS unless a concrete pain appears.
- **Naming:** components `PascalCase`; hooks `useX`; Expo Router folders for screens; message keys in `src/i18n/{en,zh}.ts`.
- **Imports:** prefer `@/` aliases over deep `../../../`.
- **Theming:** scheme-aware tokens via `useOctopTheme()` (wraps `OctopTheme.ts` Light + Dark from Ardot `Octop Tokens`). Don't hardcode hex in screens.
- **Formatting / lint:** target Expo defaults — `eslint-config-expo` + Prettier (or Biome) when added. Until then, match neighboring file style; run `npx tsc --noEmit` and `npx jest` before handoff.
- **Git hooks:** **no Husky / lint-staged for MVP.** Enforce with typecheck + Jest (and lint once configured), not pre-commit theater. Revisit hooks only if multi-contributor friction appears.
- **Commits:** concise, imperative; conventional prefixes (`feat:`, `fix:`) welcome but not mandatory. Create commits/PRs only when asked.

## Hard rules

- **Design constitution:** screens must match `docs/design/screens/*.png` (exported from Ardot). New visual work starts in the Ardot file, then re-export + port. Components mirror the Ardot library: `PillTabBar` (floating pill, 4 tabs), `cp/EmptyState` (mascot + title + subtitle + CTA), `ic/*` stroke icons, cards radius 16 + `border-primary` + shadow `0 1 3 rgba(0,0,0,.04)`, section labels 11–12 SemiBold caps letterSpacing 1, tab labels 10 caps, FAB 56 rose.
- **i18n:** zh/en only (Octop-aligned). Prefer `useI18n()` in UI so locale switches re-render; module `t()` is for non-React helpers. Settings stores preference: `system` | `en` | `zh`.
- **Sliding token:** when HTTP responses include `X-Octop-Access-Token`, persist the new JWT (`src/api/http.ts`).
- **WS auth:** `?token=` on the chat WebSocket URL; cancel is supported — see contract § chat.
- **Cleartext:** LAN `http://` allowed with one-time warning (styled dialog, design 02); **never** bypass TLS cert validation for `https://`.
- **Threads API:** `/api/agents/{id}/threads*` — do not reintroduce `/chat/sessions`. Rename/pin via `PATCH`, archive via `DELETE` (contract §4).
- **Streaming markdown:** render markdown while streaming (`StreamingBubble` + `softenStreamingMarkdown`); caret ok. Tool/thinking frames feed the process card (design 15) when the harness emits them.
- **Theming:** brand rose for primary/active (`#E85D75` light / `#F08B9A` dark), blush for assistant surfaces; dark surfaces `#0E0E0E`/`#141414` per `Octop Tokens` Dark mode.
- **Scope:** password login only in v1; no SSO, offline chat, admin TLS UI, or full console features. Knowledge & Automation tabs are read-only (Automation may toggle job `enabled`); creation flows open the web console.
- **Secrets:** never commit tokens, `.env` credentials, or SecureStore dumps.
- **E2E:** use **Maestro locally** (iOS Simulator / Android Emulator / USB device). Do not rely on EAS/Maestro Cloud for MVP. Browser Playwright/Cypress only covers `expo start --web` — not the mobile app.

## Commands

```bash
npm install
npx expo start          # Metro; open via LAN exp://… in Expo Go / simulator
npx tsc --noEmit        # typecheck
npx jest                # unit / API helper tests
maestro test .maestro   # local E2E (install Maestro CLI; boot sim/emulator first)
```

Smoke gate (manual): [scripts/smoke-checklist.md](scripts/smoke-checklist.md) and contract §6.

## When stuck

- Screen/layout/token question → Ardot file first, then `docs/design/` snapshot
- API shape / WS frames → `docs/api-contract.md`
- Why a screen exists / non-goals → design spec
- Task checklist / MVP sequencing → `docs/superpowers/plans/2026-09-11-octop-mobile-mvp.md`
- Visual direction → `.impeccable.md` then Ardot file before large UI rewrites
- Mobile E2E → Maestro docs + local sim/emulator; keep Jest for non-UI coverage
