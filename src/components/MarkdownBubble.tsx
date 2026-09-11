import { StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";

import { Text, View } from "@/components/Themed";

type MarkdownBubbleProps = {
  content: string;
  role: "user" | "assistant";
};

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  heading1: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  heading3: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  code_inline: {
    fontFamily: "monospace",
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  fence: {
    fontFamily: "monospace",
    backgroundColor: "rgba(0,0,0,0.06)",
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  link: {
    color: "#2f95dc",
    textDecorationLine: "underline",
  },
});

export function MarkdownBubble({ content, role }: MarkdownBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <View style={[styles.bubble, styles.userBubble]}>
        <Text style={styles.userText}>{content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubble, styles.assistantBubble]}>
      <Markdown style={markdownStyles}>{content}</Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2f95dc",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  userText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
});
