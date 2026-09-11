import { Image, Pressable, StyleSheet, Text, View as RNView } from "react-native";
import type { ReactNode } from "react";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { PILL_TAB_BAR_CONTENT_HEIGHT } from "@/src/components/PillTabBar";
import { useOctopTheme } from "@/src/components/useOctopTheme";

/**
 * Shared empty state (Ardot `cp/EmptyState` inside `Empty Center`):
 * octopus mascot, title, subtitle, optional CTA — designs 06/09/12/14.
 * Vertically centers in the area *above* the floating PillTabBar chrome.
 */
export function EmptyState(props: {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  footer?: ReactNode;
  /** Skip tab-bar offset (e.g. stack screens without the pill bar). */
  flushBottom?: boolean;
}) {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  // Ardot: Empty Center fills App Content; Bottom Bar (95) is a sibling, not an overlay.
  // Our tab bar is absolute, so pad that chrome out of the centering box.
  const padBottom = props.flushBottom
    ? 24
    : Math.max(21, bottomInset) + PILL_TAB_BAR_CONTENT_HEIGHT;

  return (
    <RNView style={[styles.container, { paddingBottom: padBottom }]}>
      <Image
        source={require("@/assets/images/octop-mascot-tasks.png")}
        style={styles.mascot}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={[styles.title, { color: C.text }]}>{props.title}</Text>
      {props.subtitle ? (
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>{props.subtitle}</Text>
      ) : null}
      {props.ctaLabel && props.onCta ? (
        <Pressable
          onPress={props.onCta}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: C.brand, boxShadow: `0px 3px 8px ${C.brandShadow}` },
            pressed && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={props.ctaLabel}
        >
          <Text style={[styles.ctaText, { color: C.onBrand }]}>{props.ctaLabel}</Text>
        </Pressable>
      ) : null}
      {props.footer}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  mascot: {
    width: 132,
    height: 132,
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 280,
  },
  cta: {
    marginTop: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderCurve: "continuous",
  },
  ctaPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
