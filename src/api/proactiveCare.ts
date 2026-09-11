import type { ApiClient } from "./http";
import type { ProactiveCareConfig } from "./types";

/** GET /api/agents/{agent_id}/proactive-care — proactive reminders config (contract §9). */
export function getProactiveCare(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
): Promise<ProactiveCareConfig> {
  return api.apiRequest<ProactiveCareConfig>(
    `/api/agents/${encodeURIComponent(agentId)}/proactive-care`,
  );
}

/** PUT /api/agents/{agent_id}/proactive-care — save config and reschedule (contract §9). */
export function putProactiveCare(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
  config: ProactiveCareConfig,
): Promise<ProactiveCareConfig> {
  return api.apiRequest<ProactiveCareConfig>(
    `/api/agents/${encodeURIComponent(agentId)}/proactive-care`,
    {
      method: "PUT",
      body: JSON.stringify(config),
    },
  );
}
