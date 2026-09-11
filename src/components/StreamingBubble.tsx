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
        {
          backgroundColor: C.bgElevated,
          borderColor: C.border,
          boxShadow: `0px 1px 3px ${C.cardShadow}`,
        },
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
    maxWidth: 288,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantBubble: {
    alignSelf: "flex-start",
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
  caretOff: {
    opacity: 0,
  },
});
