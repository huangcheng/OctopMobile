import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View as RNView } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import { SymbolView } from "expo-symbols";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { getToken } from "@/src/storage/secure";

type SFSymbol = Parameters<typeof SymbolView>[0]["name"];

/**
 * Embedded web console with the app session handed off.
 *
 * The Octop dashboard keeps its own JWT in `localStorage["auth_token"]`
 * (dashboard/src/api/request.ts) and sends it as `Authorization: Bearer`.
 * We seed that key from SecureStore *before* the first dashboard script
 * runs, so console-only surfaces open authenticated instead of showing
 * the login page again.
 *
 * Safety: the token is only injected on navigations that stay on the
 * server's origin (`onShouldStartLoadWithRequest` bounces everything
 * else to the system browser) — the JWT must never land on a
 * third-party origin.
 */
export default function ConsoleScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { baseUrl } = useAuth();
  const params = useLocalSearchParams<{ path?: string; title?: string }>();

  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const path = useMemo(() => {
    const raw = (params.path ?? "/").toString();
    return raw.startsWith("/") ? raw : `/${raw}`;
  }, [params.path]);

  const uri = baseUrl ? `${baseUrl.replace(/\/+$/, "")}${path}` : null;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const jwt = await getToken();
      if (!cancelled) {
        setToken(jwt);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Runs before page scripts on every load of the seeded origin. With no
  // token (cleared on 401 / sign-out) it scrubs the dashboard's stored JWT
  // instead — otherwise the webview's persisted localStorage would boot the
  // console as the previous user.
  const seedScript = token
    ? `(function(){try{localStorage.setItem('auth_token','${token}');}catch(e){}})();`
    : `(function(){try{localStorage.removeItem('auth_token');}catch(e){}})();`;

  function handleRequest(req: WebViewNavigation): boolean {
    if (!baseUrl || !uri) {
      return true;
    }
    const origin = baseUrl.replace(/\/+$/, "").toLowerCase();
    const target = req.url.toLowerCase();
    const sameOrigin = target === origin || target.startsWith(`${origin}/`);
    if (sameOrigin) {
      return true;
    }
    // Foreign links (docs, OAuth providers, …) must not receive our token.
    if (req.url === (req.mainDocumentURL ?? req.url)) {
      void WebBrowser.openBrowserAsync(req.url);
    }
    return false;
  }

  const topInset = Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0);
  const title = (params.title ?? t("console.title")).toString();

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <RNView style={[styles.header, { paddingTop: topInset + 8 }]}>
        <RNView style={styles.headerSide}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow-back", web: "arrow_back" } as unknown as SFSymbol}
              tintColor={C.brand}
              size={20}
            />
          </Pressable>
        </RNView>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          {title}
        </Text>
        <RNView style={styles.headerSide} />
      </RNView>

      {ready && uri ? (
        <WebView
          source={{ uri }}
          injectedJavaScriptBeforeContentLoaded={seedScript}
          onShouldStartLoadWithRequest={handleRequest}
          style={[styles.web, { backgroundColor: C.bg }]}
          sharedCookiesEnabled
        />
      ) : null}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerSide: {
    width: 28,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  web: {
    flex: 1,
  },
});
