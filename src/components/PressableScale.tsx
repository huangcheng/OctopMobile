import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  /** Outer Pressable layout (position, flex, etc.). */
  style?: StyleProp<ViewStyle>;
  /** Visual chrome on the scaled surface. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Press scale; default 0.97 per expo-animation press recipe. */
  scale?: number;
};

/**
 * Near-imperceptible press feedback (feedback, tens/day): 120ms ease-out scale.
 * CSS transition on the UI thread — no shared value. Full-width list rows should
 * highlight background instead of using this.
 */
export function PressableScale({
  children,
  style,
  contentStyle,
  scale = 0.97,
  hitSlop = 12,
  pressRetentionOffset = 16,
  ...rest
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...rest}
      style={style}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      onPressIn={(e) => {
        setPressed(true);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View
        style={[
          styles.box,
          contentStyle,
          pressed && { transform: [{ scale }] },
        ]}
      >
        {children}
      </Animated.View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    transform: [{ scale: 1 }],
    transitionProperty: "transform",
    transitionDuration: "120ms",
    transitionTimingFunction: "ease-out",
  },
});
