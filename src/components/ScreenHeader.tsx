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
export function ScreenHeader(props: { title: string; action?: ReactNode; sub?: ReactNode }) {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0);

  return (
    <RNView style={[styles.header, { paddingTop: topInset + 10 }]}>
      <RNView style={styles.row}>
        <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
          {props.title}
        </Text>
        {props.action}
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    flexShrink: 1,
  },
});
