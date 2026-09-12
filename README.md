# OctopMobile

English | [简体中文](./README.zh-CN.md)

**Unofficial** Expo/React Native companion for self-hosted [Octop](https://github.com/TencentCloud/Octop).

This is a **bonus / extension** project under a personal GitHub account. It is **not** an official TencentCloud product. Octop's primary clients remain the web dashboard, PWA, desktop shell, and IM channels.

A chat-centric companion — not a web-console port: pick experts, manage threads, stream replies, and keep an eye on knowledge bases and scheduled jobs.

## Status — v1.0.0 (release candidate, smoke-verified)

Everything from the [design spec](docs/superpowers/specs/2026-09-11-octop-mobile-design.md) Phase 1–2 plus the Phase 3 read-only tabs:

- **Login** — server URL + password; one-time cleartext-HTTP warning (never bypasses TLS); tokens in `expo-secure-store` with sliding renewal (`X-Octop-Access-Token`).
- **Chats** — cross-agent thread list with Today/Earlier sections, per-agent filter chips, **title/agent search**, greeting card, pull-to-refresh; rename / pin / delete / **share as Markdown** via long-press sheet.
- **Chat** — streaming replies over WebSocket with live markdown (syntax-highlighted code blocks, one-light/one-dark per scheme), tool/thinking process card, Stop (cancel), reconnect banner.
- **Experts** — search, MY EXPERTS cards, Expert Market deep-link, expert detail with quick prompts.
- **Knowledge** — read-only bases with doc counts and shared badges; **tap through to a document list and a markdown reader** (preview endpoint), search matches base names **and document titles**; share a doc as Markdown.
- **Automation** — read-only scheduled jobs with enable toggle and server-timezone footer.
- **Embedded console** — console-only surfaces (expert market, KB/cron creation, attach-KB) open an in-app webview **with the app session handed off** (the JWT is seeded into the dashboard's storage before load, strictly same-origin); creation/editing still happens in the web UI.
- **Settings** — server URL, language (system/zh/en), **appearance (system/light/dark)**, **8 brand palettes** (rose/tech/indigo/teal/violet/emerald/amber/slate — mirrors the Octop dashboard picker), proactive care, about.
- **Design system** — Elegant Rose tokens from the Ardot design file (Light + Dark), scheme-aware via `useOctopTheme()`; the tab bar uses exact Ardot icon exports.

Pinned server: **Octop `v0.9.32` minimum, verified against `v0.9.33`** — see [docs/api-contract.md](docs/api-contract.md) (HTTP + WS shapes, smoke gate §6, compatibility note).

## Development

```bash
npm install
npx expo start          # Metro; open exp://<lan-ip>:8081 in Expo Go
npm run typecheck       # tsc --noEmit
npm test                # jest
```

Requires Node 20+ and an Octop server reachable from the phone (see the pin above).

Screenshots/layout come from the [Ardot design file](https://ardot.tencent.com/file/724619963379272) (offline snapshot in [docs/design/](docs/design/)); when code and designs disagree, the designs win.

### Self-hosted HTTP (LAN)

`app.json` enables Android cleartext traffic and iOS ATS arbitrary loads **intentionally** so the app can reach self-hosted Octop over plain HTTP on a local network — this is a supported, designed feature (one-time warning dialog, design 02), not an oversight. Do **not** remove these flags: most self-hosters run plain HTTP on LAN, and valid TLS for a LAN IP is impractical (self-signed certs are unsupported by design — certificates are never bypassed). For remote access, put Octop behind HTTPS (reverse proxy + Let's Encrypt).

### E2E (Maestro, local)

```bash
maestro test .maestro/design-audit.yaml     # walks every screen + screenshots
maestro test .maestro/login.yaml -e OCTOP_URL=... -e OCTOP_USER=... -e OCTOP_PASS=...
```

Run against a booted iOS Simulator or Android Emulator with Metro on `:8081`. Release gate: [scripts/smoke-checklist.md](scripts/smoke-checklist.md).

## Building a release

`eas.json` ships two profiles:

```bash
eas build -p android --profile preview     # internal APK for direct install
eas build -p ios   --profile preview       # internal iOS build
eas build --profile production             # AAB / TestFlight (store-ready)
```

## License

Apache-2.0 — see [LICENSE](LICENSE).
