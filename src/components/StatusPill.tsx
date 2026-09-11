import { StyleSheet, Text, View as RNView } from "react-native";

import { useOctopTheme } from "@/src/components/useOctopTheme";

export type StatusKind = "running" | "stopped" | "ok" | "error";

/** Status pill (Ardot pattern: semantic bg + text, radius 999, 11–12px SemiBold). */
export function StatusPill(props: { kind: StatusKind; label: string }) {
  const C = useOctopTheme();
  const palette = {
    running: { bg: C.successBg, fg: C.success },
    ok: { bg: C.successBg, fg: C.success },
    stopped: { bg: C.bgTertiary, fg: C.textSecondary },
    error: { bg: C.dangerBg, fg: C.danger },
  }[props.kind];

  return (
    <RNView style={[styles.pill, { backgroundColor: palette.bg }]}>
      {props.kind === "ok" || props.kind === "error" ? (
        <RNView style={[styles.dot, { backgroundColor: palette.fg }]} />
      ) : null}
      <Text style={[styles.label, { color: palette.fg }]}>{props.label}</Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
