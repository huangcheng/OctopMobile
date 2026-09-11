import { StyleSheet, Text, View as RNView } from "react-native";
import type { ReactNode } from "react";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useOctopTheme } from "@/src/components/useOctopTheme";

/**
 * Large-title screen header (designs 03/08/11/13): 28pt SemiBold title with an
 * optional trailing action (e.g. the "New" pill), inset below the status bar.
 */
export function ScreenHeader(props: {
  title: string;
  action?: ReactNode;
  sub?: ReactNode;
  /** Designs 11/13 center a lone title; 03/08/19 keep it left with a trailing action. */
  align?: "left" | "center";
}) {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0);
  const centered = props.align === "center";

  return (
    <RNView style={[styles.header, { paddingTop: topInset + 10 }]}>
      <RNView style={[styles.row, centered && styles.rowCentered]}>
        {centered ? <RNView style={styles.sideSlot} /> : null}
        <Text
          style={[styles.title, centered && styles.titleCentered, { color: C.text }]}
          numberOfLines={1}
        >
          {props.title}
        </Text>
        {centered ? <RNView style={styles.sideSlot}>{props.action}</RNView> : props.action}
      </RNView>
      {props.sub}
    </RNView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowCentered: {
    justifyContent: "center",
  },
  // Equal fixed side slots keep a lone title optically centered (designs 11/13).
  sideSlot: {
    width: 36,
  },
  titleCentered: {
    textAlign: "center",
    flexShrink: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    flexShrink: 1,
  },
});
