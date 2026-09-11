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
import { Alert } from "react-native";

import { getMe, login, logout } from "../../api/auth";
import type { ApiError } from "../../api/http";
import { createApiClient } from "../../api/http";
import type { User } from "../../api/types";
import { t } from "../../i18n";
import {
  ackCleartextWarning,
  getBaseUrl,
  getCleartextWarningAck,
  normalizeBaseUrl,
  setBaseUrl as persistBaseUrl,
} from "../../storage/preferences";
import { clearToken, getToken, setToken } from "../../storage/secure";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  baseUrl: string | null;
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

function showCleartextWarning(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(t("login.cleartextWarning"), undefined, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Continue", onPress: () => resolve(true) },
    ]);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [baseUrl, setBaseUrlState] = useState<string | null>(null);
  const baseUrlRef = useRef<string | null>(null);

  const api = useMemo(
    () =>
      createApiClient({
        getBaseUrl: () => Promise.resolve(baseUrlRef.current),
        getToken,
        setToken,
        clearToken,
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedUrl = await getBaseUrl();
      if (cancelled) return;

      baseUrlRef.current = storedUrl;
      setBaseUrlState(storedUrl);

      const token = await getToken();
      if (!token) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const me = await getMe(api);
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        await clearToken();
        if (cancelled) return;
        setUser(null);
        setStatus("unauthenticated");
      }
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
      router.replace("/(tabs)/experts");
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
    () => ({ status, user, baseUrl, signIn, signOut, setBaseUrl }),
    [status, user, baseUrl, signIn, signOut, setBaseUrl],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
