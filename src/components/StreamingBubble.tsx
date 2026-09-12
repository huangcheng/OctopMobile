import { useEffect, useMemo } from "react";
import { StyleSheet, View as RNView } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Markdown from "react-native-markdown-display";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { buildAssistantMarkdownStyles } from "@/src/components/markdownStyles";
import { buildMarkdownRules } from "@/src/components/markdownRules";
import { softenStreamingMarkdown } from "@/src/utils/softenStreamingMarkdown";

type StreamingBubbleProps = {
  content: string;
};

const BLINK_HALF_MS = 265;

/** Live assistant bubble: markdown rendered as tokens arrive + UI-thread caret blink. */
export function StreamingBubble({ content }: StreamingBubbleProps) {
  const C = useOctopTheme();
  const reduced = useReducedMotion();
  const caretOpacity = useSharedValue(1);
  const rendered = useMemo(() => softenStreamingMarkdown(content), [content]);
  const markdownStyles = useMemo(() => buildAssistantMarkdownStyles(C), [C]);
  const markdownRules = useMemo(() => buildMarkdownRules(C), [C]);

  useEffect(() => {
    if (reduced) {
      caretOpacity.set(1);
      return;
    }
    caretOpacity.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: BLINK_HALF_MS, easing: Easing.linear }),
          withTiming(1, { duration: BLINK_HALF_MS, easing: Easing.linear }),
        ),
        -1,
      ),
    );
    return () => {
      caretOpacity.set(1);
    };
  }, [caretOpacity, reduced]);

  const caretStyle = useAnimatedStyle(() => ({ opacity: caretOpacity.get() }));

  return (
    <RNView
      style={[
        styles.bubble,
        styles.assistantBubble,
        {
          backgroundColor: C.bgElevated,
          borderColor: C.border,
          boxShadow: `0px 1px 3px ${C.cardShadow}`,
        },
      ]}
    >
      {content.length > 0 ? (
        <Markdown style={markdownStyles} rules={markdownRules}>
          {rendered}
        </Markdown>
      ) : null}
      <Animated.Text
        style={[
          styles.caret,
          { color: C.brandText },
          content.length > 0 && styles.caretAfter,
          caretStyle,
        ]}
      >
        ▍
      </Animated.Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantBubble: {
    alignSelf: "stretch",
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  caret: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  caretAfter: {
    marginTop: 2,
  },
});
