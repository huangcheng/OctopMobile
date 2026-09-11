export type ApiError = {
  code: "UNAUTHORIZED" | "NETWORK" | "HTTP";
  status?: number;
  message: string;
};

export type ApiClientDeps = {
  getBaseUrl: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  onUnauthorized?: () => void | Promise<void>;
  fetchImpl?: typeof fetch;
};

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(deps: ApiClientDeps) {
  const fetchImpl = deps.fetchImpl ?? fetch;

  async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const base = await deps.getBaseUrl();
    if (!base) {
      throw { code: "HTTP", message: "missing base url" } satisfies ApiError;
    }

    const token = await deps.getToken();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let res: Response;
    try {
      res = await fetchImpl(`${base}${path}`, { ...init, headers });
    } catch {
      throw { code: "NETWORK", message: "network error" } satisfies ApiError;
    }

    const renewed = res.headers.get("X-Octop-Access-Token");
    if (renewed) {
      await deps.setToken(renewed);
    }

    if (res.status === 401) {
      await deps.clearToken();
      await deps.onUnauthorized?.();
      throw { code: "UNAUTHORIZED", status: 401, message: "unauthorized" } satisfies ApiError;
    }

    if (!res.ok) {
      const text = await res.text();
      throw { code: "HTTP", status: res.status, message: text || res.statusText } satisfies ApiError;
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  return { apiRequest };
}
