import type { ApiClient } from "./http";
import type { CronJob, CronSettings } from "./types";

/** GET /api/agents/{agent_id}/cron — scheduled jobs for an owned agent (contract §9). */
export function listCronJobs(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
): Promise<CronJob[]> {
  return api.apiRequest<CronJob[]>(
    `/api/agents/${encodeURIComponent(agentId)}/cron`,
  );
}

/** PATCH /api/agents/{agent_id}/cron/{cron_id} — enable/disable a job (design 13 toggle). */
export function setCronEnabled(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
  cronId: string,
  enabled: boolean,
): Promise<CronJob> {
  return api.apiRequest<CronJob>(
    `/api/agents/${encodeURIComponent(agentId)}/cron/${encodeURIComponent(cronId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    },
  );
}

/** GET /api/cron/settings — server timezone for the Automation footer (design 13). */
export function getCronSettings(
  api: Pick<ApiClient, "apiRequest">,
): Promise<CronSettings> {
  return api.apiRequest<CronSettings>("/api/cron/settings");
}
