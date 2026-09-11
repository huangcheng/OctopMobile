import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

import { useOctopTheme } from "@/src/components/useOctopTheme";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DURATION = 180;

/**
 * Toggle (Ardot `cp/toggle-on|off`: 44×26, knob 22, on = brand, off = tertiary).
 * Two-state change → timing 180ms ease-out on the UI thread (no finger tracking).
 */
export function Toggle(props: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  const C = useOctopTheme();

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(props.value ? 18 : 0, { duration: DURATION, easing: EASE_OUT }) },
    ],
  }));

  return (
    <Pressable
      onPress={() => !props.disabled && props.onChange(!props.value)}
      style={({ pressed }) => [
        styles.track,
        { backgroundColor: props.value ? C.brand : C.bgTertiary },
        (props.disabled || pressed) && { opacity: 0.7 },
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: props.value, disabled: props.disabled }}
      accessibilityLabel={props.accessibilityLabel}
      disabled={props.disabled}
    >
      <Animated.View
        style={[styles.knob, { backgroundColor: C.onBrand }, knobStyle]}
      />
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
