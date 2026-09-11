import type { ApiClient } from "./http";
import type { Agent } from "./types";

export function listAgents(api: Pick<ApiClient, "apiRequest">): Promise<Agent[]> {
  return api.apiRequest<Agent[]>("/api/agents?scope=mine");
}

/** POST /api/agents/{agent_id}/start — owner action used by Expert detail (design 10). */
export function startAgent(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
): Promise<void> {
  return api.apiRequest<void>(
    `/api/agents/${encodeURIComponent(agentId)}/start`,
    { method: "POST" },
  );
}

/** POST /api/agents/{agent_id}/stop — owner action used by Expert detail (design 10). */
export function stopAgent(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
): Promise<void> {
  return api.apiRequest<void>(
    `/api/agents/${encodeURIComponent(agentId)}/stop`,
    { method: "POST" },
  );
}
