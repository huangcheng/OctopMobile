import type { ApiClient } from "./http";
import type { CronJob, CronSettings } from "./types";

/** GET /api/agents/{agent_id}/cron — scheduled jobs for an owned agent (contract §9). */
export async function listCronJobs(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
): Promise<CronJob[]> {
  // Server emits `id`; the client contract (and PATCH path) uses `cron_id`.
  const rows = await api.apiRequest<Array<Partial<CronJob>>>(
    `/api/agents/${encodeURIComponent(agentId)}/cron`,
  );
  return rows.map((row) => ({
    ...row,
    cron_id: row.cron_id ?? row.id ?? "",
    agent_id: row.agent_id ?? agentId,
  })) as CronJob[];
}

/** PATCH /api/agents/{agent_id}/cron/{cron_id} — enable/disable a job (design 13 toggle). */
export async function setCronEnabled(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
  cronId: string,
  enabled: boolean,
): Promise<CronJob> {
  const row = await api.apiRequest<Partial<CronJob>>(
    `/api/agents/${encodeURIComponent(agentId)}/cron/${encodeURIComponent(cronId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    },
  );
  return {
    ...row,
    cron_id: row.cron_id ?? row.id ?? cronId,
    agent_id: row.agent_id ?? agentId,
  } as CronJob;
}

/** GET /api/cron/settings — server timezone for the Automation footer (design 13). */
export function getCronSettings(
  api: Pick<ApiClient, "apiRequest">,
): Promise<CronSettings> {
  return api.apiRequest<CronSettings>("/api/cron/settings");
}
