# Octop Mobile — Design Handoff

Source of truth: Ardot file [`724619963379272`](https://ardot.tencent.com/file/724619963379272) (iterate visuals there, then re-export).
Code tokens: `constants/OctopTheme.ts` (Elegant Rose Light + Dark via `useOctopTheme`). Exported token snapshots: `tokens.css` / `tokens.json`.

## Screens → routes (implemented)

| # | Design | Route | Status |
|---|--------|-------|--------|
| 01 | login | `app/(auth)/login` | Done — logo, tagline, fields, rose CTA |
| 02 | login-http-warning | `CleartextDialog` via `AuthContext` | Done — one-time; never bypass TLS |
| 03–07 | conversation (+ loading/error/empty/actions) | `app/(tabs)/chats` | Done — sections, skeletons, sheets |
| 08–09 | experts (+ empty) | `app/(tabs)/experts` | Done |
| 10 | expert-detail | `app/expert/[agentId]` | Done |
| 11–12 | knowledge (+ empty) | `app/(tabs)/knowledge` | Done — API: contract §9 |
| 13–14 | automation (+ empty) | `app/(tabs)/automation` | Done — cron toggle + timezone |
| 15–16 | chat (+ reconnecting) | `app/chat/[threadId]` | Done — stream markdown, process card, Stop |
| 17–18 | new-chat (+ zh) | `app/chat/new` | Done — prompts + create thread |
| 19 | settings | `app/settings` | Done — server, language, proactive care, about |
| 20 | conversation-dark | theme via `useOctopTheme` | Done — scheme-aware tokens |

**Tabs:** `PillTabBar` — Chats / Experts / Knowledge / Automation (`app/(tabs)/_layout.tsx`); icons are exact Ardot exports in `assets/icons/tab-{chat,bot,book,alarm}-{w,g}.png` (white = active, gray = idle).

**Known deviations (accepted, data-driven):** SKILLS chips on expert detail (pinned Octop API has no `skills` field); empty-state mascot uses the dashboard `octop-mascot-tasks.png`; Settings header keeps a back chevron.

## Design system in the Ardot file

- **Variables** — `Octop Tokens` set: bg/text/border/brand/semantic colors × Light/Dark + radius. Bind with `$:Octop Tokens:<name>`; flip theme per screen via `variableModes`.
- **Components** — `PillTabBar`, `cp/EmptyState`, `cp/toggle-on|off`, `cp/toast-success|error|info` (spec: `components-toast.png`), `ic/*` icons.
- **Patterns** — cards 16px radius + border + soft shadow; section labels 11–12px caps; expert tiles; status pills; FAB 56 rose; toasts 14px floating card + tinted icon disc + optional rose action, auto-dismiss 2.8s (`src/components/Toast.tsx`, `useToast()`).
- **Type** — Inter (en), system CJK fallback (zh). Titles 28/20/17 SemiBold, body 16/15/14, meta 13/12/11, tab labels 10 caps.
- **Assets** — `assets/images/pwa-512.png`, mascots under `assets/images/`; tab glyphs in `assets/icons/` (exported from Ardot nodes `ic/*`).

## Beyond the frames (app-level additions)

- **Brand palettes** — Settings ▸ Theme switches the 8 curated Octop dashboard palettes (rose/tech/indigo/teal/violet/emerald/amber/slate, `dashboard/src/styles/themePalettes.ts`). Only `rose` is in the Ardot file; the others derive the brand family via `applyPalette()` in `OctopTheme.ts` (rose returns the constitution base untouched). Persisted in SecureStore, live via `useOctopTheme()`.
- **Code blocks** — fenced code renders as a dark one-dark card with lowlight highlighting (`src/components/CodeBlock.tsx`, wired through `src/components/markdownRules.tsx`); code surfaces use the `codeBg`/`codeText` tokens (dark in both schemes by design).
- **Cron ids** — server emits `id`; the client contract and PATCH path use `cron_id` (`src/api/cron.ts` normalizes on every list/patch).
- **Embedded console** — `app/console.tsx` renders the web console in a `react-native-webview` with the app JWT seeded into `localStorage["auth_token"]` (the dashboard's key, `dashboard/src/api/request.ts`) via `injectedJavaScriptBeforeContentLoaded`. `onShouldStartLoadWithRequest` bounces any non-server origin to the system browser so the token never reaches a third party. Console-only surfaces deep-link there (`/experts`, `/knowledge-bases`, `/tasks`).
- **Refresh** — pull-to-refresh drives `refreshing` only for user pulls; silent focus refreshes never toggle it (avoids a parked ~70pt spinner offset on iOS).

## Token sync notes

- `Octop` / `OctopDark` in `OctopTheme.ts`; consume via `useOctopTheme()` (avoid hardcoding hex in screens).
- Dark values from Octop dashboard `theme-vars.css` dark block (brand `#F08B9A`, layout `#0E0E0E`, cards `#141414`).

## Not designed (derive at build time)

- Skeleton shimmer animation (static bars only), pull-to-refresh, haptics, Maestro flows.
