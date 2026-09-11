import type { ApiClient } from "./http";
import type { Agent } from "./types";

export function listAgents(api: Pick<ApiClient, "apiRequest">): Promise<Agent[]> {
  return api.apiRequest<Agent[]>("/api/agents?scope=mine");
}
