import { describe, expect, test } from "@jest/globals";
import { listCronJobs, setCronEnabled } from "@/src/api/cron";
import type { ApiClient } from "@/src/api/http";

function client(rows: unknown, calls: Array<{ path: string; init?: RequestInit }> = []) {
  const apiRequest = async (path: string, init?: RequestInit) => {
    calls.push({ path, init });
    return rows;
  };
  return { apiRequest } as unknown as Pick<ApiClient, "apiRequest">;
}

describe("listCronJobs normalization", () => {
  test("maps server `id` to client `cron_id` (duplicate-key fix)", async () => {
    const rows = await listCronJobs(client([{ id: "cA", trigger: "cron:30 8 * * *", enabled: true }]), "Y92KN8");
    expect(rows).toHaveLength(1);
    expect(rows[0].cron_id).toBe("cA");
    expect(rows[0].agent_id).toBe("Y92KN8");
  });

  test("keeps an explicit cron_id and falls back to empty string", async () => {
    const rows = await listCronJobs(
      client([{ cron_id: "kept", enabled: false }, { enabled: true }]),
      "agent2",
    );
    expect(rows[0].cron_id).toBe("kept");
    expect(rows[1].cron_id).toBe("");
  });
});

describe("setCronEnabled", () => {
  test("PATCHes the cron_id path and normalizes the response", async () => {
    const calls: Array<{ path: string; init?: RequestInit }> = [];
    const api = client({ id: "cB", enabled: false }, calls);
    const row = await setCronEnabled(api as never, "Y92KN8", "cB", false);
    expect(calls[0].path).toBe("/api/agents/Y92KN8/cron/cB");
    expect(calls[0].init?.method).toBe("PATCH");
    expect(row.cron_id).toBe("cB");
  });
});
