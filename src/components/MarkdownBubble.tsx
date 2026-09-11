import { useMemo } from "react";
import { StyleSheet, Text, View as RNView } from "react-native";
import Markdown from "react-native-markdown-display";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { buildAssistantMarkdownStyles } from "@/src/components/markdownStyles";

type MarkdownBubbleProps = {
  content: string;
  role: "user" | "assistant";
};

/** Design 15: user = solid brand bubble (right); assistant = surface card (left). */
export function MarkdownBubble({ content, role }: MarkdownBubbleProps) {
  const C = useOctopTheme();
  const markdownStyles = useMemo(() => buildAssistantMarkdownStyles(C), [C]);
  const isUser = role === "user";

  if (isUser) {
    return (
      <RNView style={[styles.bubble, styles.userBubble, { backgroundColor: C.brand }]}>
        <Text style={[styles.userText, { color: C.onBrand }]}>{content}</Text>
      </RNView>
    );
  }

  return (
    <RNView
      style={[
        styles.bubble,
        styles.assistantBubble,
        { backgroundColor: C.assistantBubble, borderColor: C.assistantBorder },
      ]}
    >
      <Markdown style={markdownStyles}>{content}</Markdown>
    </RNView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "92%",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    borderCurve: "continuous",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  userText: {
    fontSize: 16,
    lineHeight: 23,
  },
});
