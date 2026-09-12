import { StyleSheet, Text, View as RNView } from "react-native";

import { useOctopTheme } from "@/src/components/useOctopTheme";

export type StatusKind = "running" | "stopped" | "ok" | "error";

/** Status pill (Ardot `Status Running/Stopped`, designs 08/10): h20, radius 10, 10pt SemiBold. */
export function StatusPill(props: { kind: StatusKind; label: string }) {
  const C = useOctopTheme();
  const palette = {
    running: { bg: C.successBg, fg: C.success },
    ok: { bg: C.successBg, fg: C.success },
    stopped: { bg: C.bgTertiary, fg: C.textTertiary },
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
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderCurve: "continuous",
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
