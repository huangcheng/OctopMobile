import { useEffect } from "react";
import { StyleSheet, View as RNView } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";

import { useOctopTheme } from "@/src/components/useOctopTheme";

const PULSE_MS = 1100;

function usePulse() {
  const opacity = useSharedValue(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      opacity.set(1);
      return;
    }
    opacity.set(
      withRepeat(
        withSequence(
          withTiming(0.45, { duration: PULSE_MS / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: PULSE_MS / 2, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
    return () => opacity.set(1);
  }, [opacity, reduced]);

  return useAnimatedStyle(() => ({ opacity: opacity.get() }));
}

/**
 * Skeleton rows for loading states (design 04): static bars that mirror the
 * thread-card anatomy, opacity-pulsed on the UI thread (reduced motion: static).
 */
export function SkeletonThreadRow() {
  const C = useOctopTheme();
  const pulse = usePulse();

  return (
    <RNView
      style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <RNView style={styles.row}>
        <Animated.View
          style={[styles.tile, { backgroundColor: C.bgTertiary }, pulse]}
        />
        <RNView style={styles.lines}>
          <Animated.View style={[styles.titleBar, { backgroundColor: C.bgTertiary }, pulse]} />
          <Animated.View style={[styles.metaBar, { backgroundColor: C.bgTertiary }, pulse]} />
        </RNView>
      </RNView>
    </RNView>
  );
}

export function SkeletonList(props: { rows?: number }) {
  const count = props.rows ?? 4;
  return (
    <RNView style={styles.list} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonThreadRow key={i} />
      ))}
    </RNView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  titleBar: {
    width: "62%",
    height: 14,
    borderRadius: 7,
  },
  metaBar: {
    width: "40%",
    height: 11,
    borderRadius: 6,
  },
});
