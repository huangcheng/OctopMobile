import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useOctopTheme } from "@/src/components/useOctopTheme";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DURATION = 180;
const KNOB_ON_X = 18;

/**
 * Toggle (Ardot `cp/toggle-on|off`: 44×26, knob 22, on = brand, off = tertiary).
 * Two-state change → timing 180ms ease-out on a shared value (UI thread).
 */
export function Toggle(props: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  const C = useOctopTheme();
  const reduced = useReducedMotion();
  const offset = useSharedValue(props.value ? KNOB_ON_X : 0);

  useEffect(() => {
    offset.set(
      withTiming(props.value ? KNOB_ON_X : 0, {
        duration: reduced ? 1 : DURATION,
        easing: EASE_OUT,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [offset, props.value, reduced]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (props.disabled) {
          return;
        }
        void Haptics.selectionAsync();
        props.onChange(!props.value);
      }}
      style={({ pressed }) => [
        styles.track,
        { backgroundColor: props.value ? C.brand : C.bgTertiary },
        (props.disabled || pressed) && { opacity: 0.7 },
      ]}
      hitSlop={8}
      pressRetentionOffset={12}
      accessibilityRole="switch"
      accessibilityState={{ checked: props.value, disabled: props.disabled }}
      accessibilityLabel={props.accessibilityLabel}
      disabled={props.disabled}
    >
      <Animated.View style={[styles.knob, { backgroundColor: C.onBrand }, knobStyle]} />
      </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderCurve: "continuous",
    padding: 2,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderCurve: "continuous",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.18)",
  },
});
