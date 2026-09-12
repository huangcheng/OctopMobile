import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getMe, login, logout } from "../../api/auth";
import type { ApiError } from "../../api/http";
import { createApiClient, type ApiClient } from "../../api/http";
import type { User } from "../../api/types";
import { t } from "../../i18n";
import { CleartextDialog } from "../../components/CleartextDialog";
import {
  ackCleartextWarning,
  getBaseUrl,
  getCleartextWarningAck,
  normalizeBaseUrl,
  setBaseUrl as persistBaseUrl,
} from "../../storage/preferences";
import { clearToken, getToken, setToken } from "../../storage/secure";

import { resolveColdStartSession } from "./coldStart";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  baseUrl: string | null;
  api: ApiClient;
  signIn: (baseUrl: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setBaseUrl: (input: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as ApiError).code === "string"
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [baseUrl, setBaseUrlState] = useState<string | null>(null);
  const baseUrlRef = useRef<string | null>(null);
  const [cleartextResolve, setCleartextResolve] = useState<((accept: boolean) => void) | null>(
    null,
  );

  /** One-time cleartext confirm rendered as the design-02 dialog (no native Alert). */
  const showCleartextWarning = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      setCleartextResolve(() => resolve);
    });
  }, []);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/(auth)/login");
  }, []);

  const api = useMemo(
    () =>
      createApiClient({
        getBaseUrl: () => Promise.resolve(baseUrlRef.current),
        getToken,
        setToken,
        clearToken,
        onUnauthorized: handleUnauthorized,
      }),
    [handleUnauthorized],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedUrl = await getBaseUrl();
      if (cancelled) return;

      baseUrlRef.current = storedUrl;
      setBaseUrlState(storedUrl);

      if (!storedUrl) {
        // No (valid) server configured — a session without one is meaningless.
        await clearToken();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
        return;
      }

      const token = await getToken();
      if (!token) {
        setStatus("unauthenticated");
        return;
      }

      const session = await resolveColdStartSession(getMe(api), clearToken);
      if (cancelled) return;
      setUser(session.user);
      setStatus(session.status);
    })();

    return () => {
      cancelled = true;
    };
  }, [api]);

  const setBaseUrl = useCallback(async (input: string) => {
    const normalized = normalizeBaseUrl(input);
    await persistBaseUrl(normalized);
    baseUrlRef.current = normalized;
    setBaseUrlState(normalized);
  }, []);

  const signIn = useCallback(
    async (baseUrlInput: string, username: string, password: string) => {
      const normalized = normalizeBaseUrl(baseUrlInput);
      await persistBaseUrl(normalized);
      baseUrlRef.current = normalized;
      setBaseUrlState(normalized);

      if (normalized.startsWith("http://")) {
        const acked = await getCleartextWarningAck();
        if (!acked) {
          const accepted = await showCleartextWarning();
          if (!accepted) {
            throw { code: "HTTP", message: "cleartext declined" } satisfies ApiError;
          }
          await ackCleartextWarning();
        }
      }

      await clearToken();

      const response = await login(api, username, password);
      await setToken(response.access_token);
      setUser(response.user);
      setStatus("authenticated");
      router.replace("/(tabs)/chats");
    },
    [api],
  );

  const signOut = useCallback(async () => {
    try {
      await logout(api);
    } catch {
      // Best-effort server logout; local session is cleared regardless.
    }
    await clearToken();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/(auth)/login");
  }, [api]);

  const value = useMemo(
    () => ({ status, user, baseUrl, api, signIn, signOut, setBaseUrl }),
    [status, user, baseUrl, api, signIn, signOut, setBaseUrl],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <CleartextDialog
        visible={cleartextResolve !== null}
        onAnswer={(accept) => {
          const resolve = cleartextResolve;
          setCleartextResolve(null);
          resolve?.(accept);
        }}
      />
      </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function mapAuthError(error: unknown): string {
  if (error instanceof Error && error.message === "BASE_URL_INVALID") {
    return t("errors.network");
  }
  if (isApiError(error)) {
    if (error.code === "UNAUTHORIZED" || error.code === "HTTP") {
      return t("errors.unauthorized");
    }
    if (error.code === "NETWORK") {
      return t("errors.network");
    }
  }
  return t("errors.network");
}
