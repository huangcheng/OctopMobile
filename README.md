# OctopMobile

**Unofficial** Expo/React Native companion for self-hosted [Octop](https://github.com/TencentCloud/Octop).

This is a **bonus / extension** project under a personal GitHub account. It is **not** an official TencentCloud product. Octop’s primary clients remain the web dashboard, PWA, desktop shell, and IM channels.

Inspired by WorkBuddy-style **limited** mobile surfaces (tasks / experts / light knowledge) — not a full console port.

## Status

**Phase 1 MVP — in progress**

- Spec: [docs/superpowers/specs/2026-09-11-octop-mobile-design.md](docs/superpowers/specs/2026-09-11-octop-mobile-design.md)
- API contract (Phase 0): [docs/api-contract.md](docs/api-contract.md) — pinned Octop **`v0.9.32`** (`deb7ac81e89b8779fec59378684582efcde70d43`)
- MVP plan: [docs/superpowers/plans/2026-09-11-octop-mobile-mvp.md](docs/superpowers/plans/2026-09-11-octop-mobile-mvp.md)
- Expo Router app: **Experts** + **Tasks** tabs, auth, per-agent threads, WS chat streaming (`npx expo start`)

## Development

```bash
npm install
npx expo start
```

Open in Expo Go (LAN) or a simulator. Expect two empty tabs: Experts and Tasks.

### Self-hosted HTTP (LAN)

`app.json` enables Android cleartext traffic and iOS ATS arbitrary loads **intentionally** so the app can reach self-hosted Octop over plain HTTP on a local network. Use HTTPS in production when possible.

## Smoke path

Release gate (manual): [docs/api-contract.md §6](docs/api-contract.md#6-smoke-path-release-gate). Checklist: [scripts/smoke-checklist.md](scripts/smoke-checklist.md).

1. `GET /api/health` → `ok: true`
2. `POST /api/auth/login` → store `access_token`
3. `GET /api/agents` → pick `agent_id`
4. `POST /api/agents/{id}/threads` → `thread_id`
5. Open WS with `?token=`
6. Send `user_turn` with `text` + `thread_id`
7. Receive ≥1 `token` then `done`
8. `GET .../threads/{thread_id}/history` → messages include the turn
9. (Optional) second turn + `cancel` while streaming

## Related

- Upstream wish: [TencentCloud/Octop#638](https://github.com/TencentCloud/Octop/issues/638)
- Unrelated: [OctopPet](https://github.com/jubaoliang/OctopPet) (desktop pet)

## License

See [LICENSE](LICENSE).
