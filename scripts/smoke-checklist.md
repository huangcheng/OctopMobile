# OctopMobile — smoke checklist

Manual release gate against a live Octop **`v0.9.32`** instance (or a later compatible release after re-verifying [docs/api-contract.md](../docs/api-contract.md)).

Source: [api-contract §6](../docs/api-contract.md#6-smoke-path-release-gate).

- [ ] 1. `GET /api/health` → `ok: true`
- [ ] 2. `POST /api/auth/login` → store `access_token`
- [ ] 3. `GET /api/agents` → pick `agent_id`
- [ ] 4. `POST /api/agents/{id}/threads` → `thread_id`
- [ ] 5. Open WS `{wsBase}/api/agents/{agent_id}/chat/ws?token={jwt}`
- [ ] 6. Send `user_turn` with `text` + `thread_id`
- [ ] 7. Receive ≥1 `token` frame, then `done`
- [ ] 8. `GET /api/agents/{id}/threads/{thread_id}/history` → messages include the turn
- [ ] 9. (Optional) second turn + `cancel` while streaming

**In-app path:** Settings → set base URL → login → Experts → pick agent → Tasks → new chat → send message → verify streaming reply and history.
