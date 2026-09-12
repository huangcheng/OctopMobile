# OctopMobile — smoke checklist

Manual release gate against a live Octop **`v0.9.32`** instance (or a later compatible release after re-verifying [docs/api-contract.md](../docs/api-contract.md)).

Source: [api-contract §6](../docs/api-contract.md#6-smoke-path-release-gate).

- [x] 1. `GET /api/health` → `ok: true` — verified 2026-09-12: `{"ok":true,"db":true,"users_loaded":3}` against `192.168.31.200:9000`
- [x] 2. `POST /api/auth/login` → store `access_token` — verified 2026-09-12 in-app on iPhone 17 Pro (iOS 26.4) as `smoke-e2e`; server-side also verified via direct POST
- [x] 3. `GET /api/agents` → pick `agent_id` — verified 2026-09-12: Experts list shows `Smoke Tester` (DGCNG3), greeting “1 位专家运行中”
- [x] 4. `POST /api/agents/{id}/threads` → `thread_id` — verified 2026-09-12 in-app (smoke-turn.yaml a2-step4)
- [x] 5. Open WS `{wsBase}/api/agents/{agent_id}/chat/ws?token={jwt}`
- [x] 6. Send `user_turn` with `text` + `thread_id`
- [x] 7. Receive ≥1 `token` frame, then `done` — verified 2026-09-12: reply "pong" streamed in-app (a2-step7); server-side also via `octop chats send`
- [x] 8. history includes the turn — verified 2026-09-12: reopened thread renders user turn + reply (今天 section)
- [ ] 9. (Optional) second turn + `cancel` while streaming

**In-app path:** Settings → set base URL → login → Experts → pick agent → Tasks → new chat → send message → verify streaming reply and history.

**Automated:** `.maestro/smoke/` covers this path end-to-end (login error → login → experts → chat streaming → thread actions → tabs → logout). Run:

```bash
maestro test -e OCTOP_URL=http://192.168.x.x:9000 -e OCTOP_USER=admin -e OCTOP_PASS=secret .maestro/smoke/suite.yaml
```

`suite.yaml` runs `00` → `07` in order (folder runs are unordered); `04` expects a running expert and sends a real turn (cleaned up by `05`). Requires Expo Go on a booted simulator with Metro on :8081.


## Run log — 2026-09-12 (second pass)

- Steps 4–8 completed in-app on iPhone 17 Pro as `smoke-e2e` against the local
  v0.9.33 server: thread → WS stream ("pong") → reopen shows both turns.
  Test data: agents Smoke Tester / News Reporter / AI 安全合规卫士 (CLI-created).
- Appearance switcher (Settings ▸ 外观) verified live: bg token flips
  `#0E0E0E` → `#F5F6F8` (pixel-sampled screenshots lc-2/lc-3).
- Dev-menu note: Expo Go's dev menu intermittently opens on cold start under
  Maestro and blocks flows — close it (`tapOn: "Close"`) or run warm.

## Run log — 2026-09-12

- Step 1: `curl http://192.168.31.200:9000/api/health` → `{"ok":true,"db":true,...}`.
- Steps 2–3: in-app login on iPhone 17 Pro simulator (Expo Go, zh) as throwaway
  user `smoke-e2e` (created via `octop user create`); cleartext HTTP ack stored,
  Experts/Chats render for the new user. Server login also verified with curl
  (token + `AUTH_FAILED` on bad password).
- Steps 4–9: **not yet run end-to-end** — the shared sim/emulator hosts were
  contended (parallel E2E suite + an emulator reprovision with a dead System UI,
  plus a host NAT that reaches Metro :8081 but not the Octop :9000 socket).
  Run when free: `maestro test .maestro/smoke-turn.yaml` (iOS, zh) and
  `.maestro/smoke-turn-en.yaml` (Android, en) after `smoke-login*.yaml`.
- Android partial pass: bundle loads, login screen + cleartext dialog verified
  (designs 01/02, en-US); authenticated turn blocked by host networking above.
