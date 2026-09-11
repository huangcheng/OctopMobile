import type { ApiClient } from "./http";
import type { CreateThreadResponse, HistoryResponse, ThreadHistoryOptions, ThreadSummary } from "./types";

export function listThreads(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
  limit = 50,
): Promise<ThreadSummary[]> {
  return api.apiRequest<ThreadSummary[]>(`/api/agents/${encodeURIComponent(agentId)}/threads?limit=${limit}`);
}

export function createThread(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
): Promise<CreateThreadResponse> {
  return api.apiRequest<CreateThreadResponse>(`/api/agents/${encodeURIComponent(agentId)}/threads`, {
    method: "POST",
  });
}

export function getThreadHistory(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
  threadId: string,
  opts: ThreadHistoryOptions = {},
): Promise<HistoryResponse> {
  const limit = opts.limit ?? 25;
  const offset = opts.offset ?? 0;
  const path =
    `/api/agents/${encodeURIComponent(agentId)}/threads/${encodeURIComponent(threadId)}/history` +
    `?limit=${limit}&offset=${offset}`;
  return api.apiRequest<HistoryResponse>(path);
}

/** PATCH /api/agents/{id}/threads/{thread_id} — rename and/or pin (contract §4, design 07). */
export function updateThread(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
  threadId: string,
  patch: { title?: string; pinned?: boolean },
): Promise<ThreadSummary> {
  return api.apiRequest<ThreadSummary>(
    `/api/agents/${encodeURIComponent(agentId)}/threads/${encodeURIComponent(threadId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
}

/** DELETE /api/agents/{id}/threads/{thread_id} — archive (contract §4, design 07). */
export function deleteThread(
  api: Pick<ApiClient, "apiRequest">,
  agentId: string,
  threadId: string,
): Promise<void> {
  return api.apiRequest<void>(
    `/api/agents/${encodeURIComponent(agentId)}/threads/${encodeURIComponent(threadId)}`,
    { method: "DELETE" },
  );
}
