import { CodeBlock } from "@/src/components/CodeBlock";
import type { OctopThemeTokens } from "@/constants/OctopTheme";

type MdNode = { key: string; content?: string; sourceInfo?: string };

/** Custom markdown render rules shared by finalized + streaming bubbles. */
export function buildMarkdownRules(C: OctopThemeTokens) {
  return {
    fence: (node: MdNode) => (
      <CodeBlock
        key={node.key}
        code={(node.content ?? "").replace(/\n$/, "")}
        language={node.sourceInfo || null}
        C={C}
      />
    ),
    code_block: (node: MdNode) => (
      <CodeBlock key={node.key} code={(node.content ?? "").replace(/\n$/, "")} C={C} />
    ),
  };
}
