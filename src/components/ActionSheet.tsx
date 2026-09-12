import { Modal, Pressable, StyleSheet, Text, View as RNView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInDown, useReducedMotion } from "react-native-reanimated";

import { useOctopTheme } from "@/src/components/useOctopTheme";

export type SheetAction = {
  key: string;
  label: string;
  icon: { ios: string; android: string; web: string };
  destructive?: boolean;
  onPress: () => void;
};

const ABSOLUTE_FILL = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

/**
 * Bottom action sheet (design 07): dark scrim, elevated sheet with top-radius 24,
 * grabber, icon rows; destructive action in danger red. Occasional surface →
 * sheet slides in (~300ms spring, reduced motion: fade); dismiss fades out.
 */
export function ActionSheet(props: {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onDismiss: () => void;
}) {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  if (!props.visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={props.onDismiss}>
      <RNView style={styles.fill}>
      <RNView style={[styles.scrim, { backgroundColor: C.scrim }]} />
      <Pressable
          style={styles.scrimPress}
          onPress={props.onDismiss}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
      <RNView style={styles.sheetAnchor}>
      <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: C.bgElevated,
                paddingBottom: Math.max(32, insets.bottom + 16),
              },
            ]}
            entering={
              reduced
                ? FadeIn.duration(200)
                : SlideInDown.springify().dampingRatio(0.8).duration(300)
            }
          >
      <RNView style={[styles.grabber, { backgroundColor: C.border }]} />
            {props.title ? (
              <Text style={[styles.title, { color: C.textSecondary }]} numberOfLines={1}>
                {props.title}
              </Text>
            ) : null}
            {props.actions.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => {
                  if (action.destructive) {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } else {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  props.onDismiss();
                  action.onPress();
                }}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: C.borderSecondary },
                  pressed && { backgroundColor: C.bgTertiary },
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
      <SymbolView
                  name={action.icon as unknown as Parameters<typeof SymbolView>[0]["name"]}
                  tintColor={action.destructive ? C.danger : C.text}
                  size={20}
                />
      <Text style={[styles.rowLabel, { color: action.destructive ? C.danger : C.text }]}>
                  {action.label}
                </Text>
      </Pressable>
            ))}
          </Animated.View>
      </RNView>
      </RNView>
      </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...ABSOLUTE_FILL,
  },
  scrimPress: {
    ...ABSOLUTE_FILL,
  },
  sheetAnchor: {
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: "continuous",
    boxShadow: "0px -4px 24px rgba(0, 0, 0, 0.12)",
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
