import type { ApiError } from "../../api/http";
import type { User } from "../../api/types";

type ColdStartStatus = "authenticated" | "unauthenticated";

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as ApiError).code === "string"
  );
}

export async function resolveColdStartSession(
  mePromise: Promise<User>,
  clearTokenFn: () => Promise<void>,
): Promise<{ status: ColdStartStatus; user: User | null }> {
  try {
    const me = await mePromise;
    return { status: "authenticated", user: me };
  } catch (error) {
    if (isApiError(error) && error.code === "UNAUTHORIZED") {
      await clearTokenFn();
      return { status: "unauthenticated", user: null };
    }
    return { status: "authenticated", user: null };
  }
}
