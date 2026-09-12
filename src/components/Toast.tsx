import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View as RNView } from "react-native";
import { SymbolView } from "expo-symbols";
import { useSegments } from "expo-router";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { PILL_TAB_BAR_CONTENT_HEIGHT } from "@/src/components/PillTabBar";
import { useOctopTheme } from "@/src/components/useOctopTheme";

export type ToastKind = "success" | "error" | "info";

export type ToastOptions = {
  kind?: ToastKind;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

const ToastContext = createContext<{ show: (options: ToastOptions) => void }>({
  show: () => undefined,
});

/** Show a transient feedback toast (Ardot `cp/toast-*`). */
export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastKind, { ios: string; android: string; web: string }> = {
  success: { ios: "checkmark", android: "check", web: "check" },
  error: { ios: "exclamationmark.circle", android: "error_outline", web: "error_outline" },
  info: { ios: "info.circle", android: "info", web: "info" },
};

/**
 * Ardot `cp/toast-*`: floating card (surface + border + 0 8 20 shadow),
 * tinted 28px icon disc, 13 SemiBold message, optional rose action.
 * Floats above the PillTabBar on tab screens, above the home inset elsewhere.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const translate = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translate, { toValue: 24, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translate]);

  const show = useCallback(
    (options: ToastOptions) => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
      const id = Date.now();
      setToast({ ...options, id });
      translate.setValue(24);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translate, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      dismissTimer.current = setTimeout(dismiss, options.durationMs ?? 2800);
    },
    [dismiss, opacity, translate],
  );

  useEffect(() => {
    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const kind = toast?.kind ?? "info";
  const palette = {
    success: { fg: C.success, bg: C.successBg },
    error: { fg: C.danger, bg: C.dangerBg },
    info: { fg: C.info, bg: C.infoBg },
  }[kind];

  const bottomInset = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  const onTabScreen = segments[0] === "(tabs)";
  const bottom = Math.max(21, bottomInset) + (onTabScreen ? PILL_TAB_BAR_CONTENT_HEIGHT + 8 : 12);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.host, { bottom, transform: [{ translateY: translate }], opacity }]}
        >
          <RNView
            style={[
              styles.card,
              {
                backgroundColor: C.bgElevated,
                borderColor: C.border,
                boxShadow: "0px 8px 20px rgba(7, 9, 15, 0.10)",
              },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <RNView style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
              <SymbolView
                name={ICONS[kind] as unknown as Parameters<typeof SymbolView>[0]["name"]}
                tintColor={palette.fg}
                size={14}
              />
            </RNView>
            <Text style={[styles.message, { color: C.text }]} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel ? (
              <Pressable
                onPress={() => {
                  toast.onAction?.();
                  dismiss();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={toast.actionLabel}
              >
                <Text style={[styles.action, { color: C.brandText }]}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </RNView>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 320,
    maxWidth: "92%",
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  action: {
    fontSize: 13,
    fontWeight: "600",
  },
});
