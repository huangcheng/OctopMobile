import { useMemo } from "react";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { createLowlight, common } from "lowlight";

import type { OctopThemeTokens } from "@/constants/OctopTheme";

const lowlight = createLowlight(common);

/** hljs scope → color. Light: prism one-light, exactly as the Octop dashboard. */
const SYNTAX_LIGHT: Record<string, string> = {
  keyword: "#A626A4",
  built_in: "#50A14F",
  type: "#B76B01",
  literal: "#B76B01",
  number: "#B76B01",
  string: "#50A14F",
  subst: "#383A42",
  comment: "#A0A1A7",
  quote: "#50A14F",
  doctag: "#A626A4",
  meta: "#B76B01",
  "keyword-literals": "#A626A4",
  title: "#4078F2",
  "title.function": "#4078F2",
  "title.class": "#B76B01",
  section: "#4078F2",
  name: "#E45649",
  attr: "#B76B01",
  attribute: "#B76B01",
  variable: "#4078F2",
  "variable.language": "#A626A4",
  operator: "#4078F2",
  punctuation: "#383A42",
  symbol: "#E45649",
  "selector-tag": "#E45649",
  "selector-class": "#B76B01",
  "selector-id": "#4078F2",
  "selector-attr": "#B76B01",
  "selector-pseudo": "#A626A4",
  "template-tag": "#E45649",
  "template-variable": "#4078F2",
  regexp: "#0184BC",
  link: "#4078F2",
  bullet: "#B76B01",
  code: "#50A14F",
  emphasis: "#B76B01",
  strong: "#E45649",
  formula: "#0184BC",
};

/** hljs scope → color. Dark: prism one-dark, exactly as the Octop dashboard. */
const SYNTAX_DARK: Record<string, string> = {
  keyword: "#C678DD",
  built_in: "#98C379",
  type: "#D19A66",
  literal: "#D19A66",
  number: "#D19A66",
  string: "#98C379",
  subst: "#ABB2BF",
  comment: "#5C6370",
  quote: "#98C379",
  doctag: "#C678DD",
  meta: "#D19A66",
  "keyword-literals": "#C678DD",
  title: "#61AFEF",
  "title.function": "#61AFEF",
  "title.class": "#D19A66",
  section: "#61AFEF",
  name: "#E06C75",
  attr: "#D19A66",
  attribute: "#D19A66",
  variable: "#61AFEF",
  "variable.language": "#C678DD",
  operator: "#61AFEF",
  punctuation: "#ABB2BF",
  symbol: "#E06C75",
  "selector-tag": "#E06C75",
  "selector-class": "#D19A66",
  "selector-id": "#61AFEF",
  "selector-attr": "#D19A66",
  "selector-pseudo": "#C678DD",
  "template-tag": "#E06C75",
  "template-variable": "#61AFEF",
  regexp: "#98C379",
  link: "#61AFEF",
  bullet: "#D19A66",
  code: "#98C379",
  emphasis: "#D19A66",
  strong: "#E06C75",
  formula: "#56B6C2",
};

type HastChild = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string[] };
  children?: HastChild[];
};

function colorFor(classNames: string[] | undefined, syntax: Record<string, string>): string | undefined {
  if (!classNames) {
    return undefined;
  }
  for (const cls of classNames) {
    const key = cls.replace(/^hljs-/, "");
    if (syntax[key]) {
      return syntax[key];
    }
  }
  return undefined;
}

function renderNodes(
  nodes: HastChild[] | undefined,
  keyPrefix: string,
  syntax: Record<string, string>,
): ReactNode[] {
  if (!nodes) {
    return [];
  }
  const out: ReactNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "text" && node.value) {
      out.push(node.value);
    } else if (node.type === "element" && node.children) {
      const color = colorFor(node.properties?.className, syntax);
      const inner = renderNodes(node.children, `${keyPrefix}-${i}`, syntax);
      out.push(
        color ? (
          <Text key={`${keyPrefix}-${i}`} style={{ color }}>
            {inner}
          </Text>
        ) : (
          inner
        ),
      );
    } else if (node.value) {
      // Unknown node types (e.g. "comment") still carry their raw value.
      out.push(node.value);
    }
  }
  return out;
}

/**
 * Fenced code block with lowlight syntax highlighting: scheme-aware card
 * (one-light on light, one-dark on dark — same as the Octop dashboard),
 * SpaceMono, horizontal scroll instead of mid-token wrapping.
 */
export function CodeBlock(props: { code: string; language?: string | null; C: OctopThemeTokens }) {
  const { code, language } = props;
  const syntax = props.C.scheme === "dark" ? SYNTAX_DARK : SYNTAX_LIGHT;
  // Highlight in a memo: streaming re-renders (per token + caret blink) must
  // not re-tokenize. No-language blocks skip highlighting entirely —
  // `highlightAuto` fans out across every registered grammar each pass.
  const tree = useMemo<HastChild[] | undefined>(() => {
    if (!language || !lowlight.registered(language)) {
      return undefined;
    }
    try {
      // lowlight v3 returns hast `Root`; we only walk its element/text children.
      return lowlight.highlight(language, code).children as unknown as HastChild[];
    } catch {
      return undefined;
    }
  }, [code, language]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, { backgroundColor: props.C.codeBg, borderColor: props.C.border }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.code, { color: props.C.codeText }]} selectable>
        {tree ? renderNodes(tree, "cb", syntax) : code}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 6,
    maxWidth: "100%",
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  code: {
    fontFamily: "SpaceMono",
    fontSize: 12.5,
    lineHeight: 19,
  },
});
