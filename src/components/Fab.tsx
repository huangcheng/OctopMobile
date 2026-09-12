import { ActivityIndicator, StyleSheet } from "react-native";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

import { PILL_TAB_BAR_CONTENT_HEIGHT } from "@/src/components/PillTabBar";
import { PressableScale } from "@/src/components/PressableScale";
import { useOctopTheme } from "@/src/components/useOctopTheme";

/** 56px rose FAB with brand shadow (Ardot pattern, designs 11/13). */
export function Fab(props: {
  onPress: () => void;
  busy?: boolean;
  accessibilityLabel: string;
  icon?: { ios: string; android: string; web: string };
}) {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  // Sit just above Ardot Bottom Bar (padBottom + 12 + 62) with an 8pt gap.
  const bottom = Math.max(21, bottomInset) + PILL_TAB_BAR_CONTENT_HEIGHT + 8;
  const icon = props.icon ?? { ios: "plus", android: "add", web: "add" };

  return (
    <PressableScale
      onPress={props.onPress}
      style={[styles.host, { bottom }]}
      contentStyle={[
        styles.fab,
        {
          backgroundColor: C.brand,
          boxShadow: `0px 6px 16px rgba(232, 93, 117, 0.35)`,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      disabled={props.busy}
    >
      {props.busy ? (
        <ActivityIndicator color={C.onBrand} />
      ) : (
        <SymbolView
          name={icon as unknown as Parameters<typeof SymbolView>[0]["name"]}
          tintColor={C.onBrand}
          size={22}
        />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    right: 20,
    zIndex: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
});
