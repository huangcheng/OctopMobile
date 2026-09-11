import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View as RNView } from "react-native";
import Markdown from "react-native-markdown-display";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { buildAssistantMarkdownStyles } from "@/src/components/markdownStyles";
import { softenStreamingMarkdown } from "@/src/utils/softenStreamingMarkdown";

type StreamingBubbleProps = {
  content: string;
};

/** Live assistant bubble: markdown rendered as tokens arrive + blinking caret. */
export function StreamingBubble({ content }: StreamingBubbleProps) {
  const C = useOctopTheme();
  const [caretOn, setCaretOn] = useState(true);
  const rendered = useMemo(() => softenStreamingMarkdown(content), [content]);
  const markdownStyles = useMemo(() => buildAssistantMarkdownStyles(C), [C]);

  useEffect(() => {
    const id = setInterval(() => setCaretOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <RNView
      style={[
        styles.bubble,
        styles.assistantBubble,
        { backgroundColor: C.assistantBubble, borderColor: C.assistantBorder },
      ]}
    >
      {content.length > 0 ? (
        <Markdown style={markdownStyles}>{rendered}</Markdown>
      ) : null}
      <Text style={[styles.caret, { color: C.brand }, content.length > 0 && styles.caretAfter, !caretOn && styles.caretOff]}>
        ▍
      </Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "92%",
    paddingHorizontal: 14,
    paddingVertical: 11,
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
  caret: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  caretAfter: {
    marginTop: 2,
  },
  caretOff: {
    opacity: 0,
  },
});
