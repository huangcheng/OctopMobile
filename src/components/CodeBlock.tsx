import { ScrollView, StyleSheet, Text } from "react-native";
import { createLowlight, common } from "lowlight";

import type { OctopThemeTokens } from "@/constants/OctopTheme";

const lowlight = createLowlight(common);

/** hljs scope → dark-card color (Octop-flavored one-dark palette). */
const SCOPE_COLORS: Record<string, string> = {
  keyword: "#C792EA",
  built_in: "#E5C07B",
  type: "#61AFEF",
  literal: "#D19A66",
  number: "#D19A66",
  string: "#98C379",
  subst: "#E5E7EB",
  comment: "#6B7280",
  quote: "#98C379",
  doctag: "#C792EA",
  meta: "#61AFEF",
  "keyword-literals": "#C792EA",
  title: "#61AFEF",
  "title.function": "#61AFEF",
  "title.class": "#E5C07B",
  section: "#61AFEF",
  name: "#F08B9A",
  attr: "#E5C07B",
  attribute: "#E5C07B",
  variable: "#F08B9A",
  "variable.language": "#C792EA",
  operator: "#56B6C2",
  punctuation: "#ABB2BF",
  symbol: "#56B6C2",
  "selector-tag": "#F08B9A",
  "selector-class": "#E5C07B",
  "selector-id": "#61AFEF",
  "selector-attr": "#E5C07B",
  "selector-pseudo": "#C792EA",
  "template-tag": "#F08B9A",
  "template-variable": "#E5C07B",
  regexp: "#56B6C2",
  link: "#61AFEF",
  bullet: "#D19A66",
  code: "#98C379",
  emphasis: "#E5C07B",
  strong: "#F08B9A",
  formula: "#56B6C2",
};

type HastChild = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string[] };
  children?: HastChild[];
};

function colorFor(classNames: string[] | undefined): string | undefined {
  if (!classNames) {
    return undefined;
  }
  for (const cls of classNames) {
    const key = cls.replace(/^hljs-/, "");
    if (SCOPE_COLORS[key]) {
      return SCOPE_COLORS[key];
    }
  }
  return undefined;
}

function renderNodes(nodes: HastChild[] | undefined, keyPrefix: string): React.ReactNode[] {
  if (!nodes) {
    return [];
  }
  const out: React.ReactNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "text" && node.value) {
      out.push(node.value);
    } else if (node.type === "element" && node.children) {
      const color = colorFor(node.properties?.className);
      const inner = renderNodes(node.children, `${keyPrefix}-${i}`);
      out.push(
        color ? (
          <Text key={`${keyPrefix}-${i}`} style={{ color }}>
            {inner}
          </Text>
        ) : (
          inner
        ),
      );
    }
  }
  return out;
}

/**
 * Fenced code block with lowlight syntax highlighting: dark card,
 * SpaceMono, horizontal scroll instead of mid-token wrapping.
 */
export function CodeBlock(props: { code: string; language?: string | null; C: OctopThemeTokens }) {
  const { code, language } = props;
  let tree: HastChild[] | undefined;
  try {
    const hasLang = language && lowlight.registered(language);
    const result = hasLang
      ? lowlight.highlight(language as string, code)
      : lowlight.highlightAuto(code);
    tree = result.children as unknown as HastChild[];
  } catch {
    tree = undefined;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, { backgroundColor: "#11161D", borderColor: props.C.border }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.code} selectable>
        {tree ? renderNodes(tree, "cb") : code}
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
    color: "#E5E7EB",
  },
});
