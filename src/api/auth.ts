import type { ApiClient } from "./http";
import type { LoginResponse, User } from "./types";

export function login(
  api: Pick<ApiClient, "apiRequest">,
  username: string,
  password: string,
): Promise<LoginResponse> {
  return api.apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout(api: Pick<ApiClient, "apiRequest">): Promise<void> {
  return api.apiRequest<void>("/api/auth/logout", { method: "POST" });
}

export function getMe(api: Pick<ApiClient, "apiRequest">): Promise<User> {
  return api.apiRequest<User>("/api/auth/me");
}
