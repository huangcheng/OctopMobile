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
    code_inline: {
      fontFamily: "monospace",
      backgroundColor: C.brandBg,
      color: C.brandActive,
      paddingHorizontal: 5,
      borderRadius: 4,
    },
    fence: {
      fontFamily: "monospace",
      backgroundColor: C.bgTertiary,
      padding: 10,
      borderRadius: 10,
      marginVertical: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
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
