import { useMemo } from "react";
import { StyleSheet, Text, View as RNView } from "react-native";
import Markdown from "react-native-markdown-display";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { buildAssistantMarkdownStyles } from "@/src/components/markdownStyles";
import { buildMarkdownRules } from "@/src/components/markdownRules";

type MarkdownBubbleProps = {
  content: string;
  role: "user" | "assistant";
};

/** Design 15: user = solid brand bubble (right, rose shadow); assistant = white card + border (left). */
export function MarkdownBubble({ content, role }: MarkdownBubbleProps) {
  const C = useOctopTheme();
  const markdownStyles = useMemo(() => buildAssistantMarkdownStyles(C), [C]);
  const markdownRules = useMemo(() => buildMarkdownRules(C), [C]);
  const isUser = role === "user";

  if (isUser) {
    return (
      <RNView
        style={[
          styles.bubble,
          styles.userBubble,
          { backgroundColor: C.brand, boxShadow: "0px 4px 14px rgba(232, 93, 117, 0.18)" },
        ]}
      >
      <Text style={[styles.userText, { color: C.onBrand }]}>{content}</Text>
      </RNView>
    );
  }

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
      <Markdown style={markdownStyles} rules={markdownRules}>{content}</Markdown>
      </RNView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    paddingVertical: 11,
    borderRadius: 18,
    borderCurve: "continuous",
  },
  // Small screens: assistant card spans the full content width (reference apps).
  assistantBubble: {
    alignSelf: "stretch",
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  userText: {
    fontSize: 16,
    lineHeight: 23,
  },
});
