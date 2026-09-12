import { StyleSheet } from "react-native";

import type { OctopThemeTokens } from "@/constants/OctopTheme";

/** Shared markdown styles for assistant bubbles (live stream + finalized), theme-aware. */
export function buildAssistantMarkdownStyles(C: OctopThemeTokens) {
  return StyleSheet.create({
    body: {
      fontSize: 16,
      lineHeight: 23,
      color: C.text,
    },
    heading1: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8,
      color: C.text,
    },
    heading2: {
      fontSize: 19,
      fontWeight: "700",
      marginBottom: 6,
      color: C.text,
    },
    heading3: {
      fontSize: 17,
      fontWeight: "600",
      marginBottom: 4,
      color: C.text,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      marginVertical: 2,
    },
    // NOTE: fenced blocks never hit these styles — markdownRules.tsx replaces
    // the fence/code_block rules with <CodeBlock /> (scheme-aware one-light/
    // one-dark card, mirroring the Octop dashboard).
    code_inline: {
      fontFamily: "SpaceMono",
      backgroundColor: C.brandBg,
      color: C.brandActive,
      paddingHorizontal: 5,
      borderRadius: 4,
    },
    hr: {
      backgroundColor: C.border,
      height: StyleSheet.hairlineWidth,
      marginVertical: 10,
    },
    link: {
      color: C.brand,
      textDecorationLine: "underline",
    },
    strong: {
      fontWeight: "700",
      color: C.text,
    },
  });
}
