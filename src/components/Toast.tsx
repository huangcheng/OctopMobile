import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View as RNView } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown, useReducedMotion } from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
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
 * Occasional feedback → Reanimated enter/exit; reduced motion: fade only.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const reduced = useReducedMotion();
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    setToast(null);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
      const kind = options.kind ?? "info";
      if (kind === "success") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (kind === "error") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setToast({ ...options, id: Date.now() });
      dismissTimer.current = setTimeout(dismiss, options.durationMs ?? 2800);
    },
    [dismiss],
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
          key={toast.id}
          pointerEvents="box-none"
          entering={reduced ? FadeIn.duration(150) : FadeInDown.duration(220)}
          exiting={reduced ? FadeOut.duration(120) : FadeOutDown.duration(180)}
          style={[styles.host, { bottom }]}
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
