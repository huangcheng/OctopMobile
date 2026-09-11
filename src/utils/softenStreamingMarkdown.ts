/**
 * Soft-close unfinished markdown so mid-stream renders look like other chat apps
 * instead of showing raw `**` / open fences.
 */
export function softenStreamingMarkdown(source: string): string {
  let text = source;

  // Close an open fenced code block (``` …) so partial code still renders.
  const fenceStarts = text.match(/^```/gm) ?? [];
  if (fenceStarts.length % 2 === 1) {
    text += "\n```";
  }

  // Work on a copy with fenced blocks removed for inline balancing.
  const withoutFences = text.replace(/```[\s\S]*?```/g, "");

  const tickCount = (withoutFences.match(/`/g) ?? []).length;
  if (tickCount % 2 === 1) {
    text += "`";
  }

  const withoutInlineCode = withoutFences.replace(/`[^`]*`/g, "");
  const boldCount = (withoutInlineCode.match(/\*\*/g) ?? []).length;
  if (boldCount % 2 === 1) {
    text += "**";
  }

  return text;
}
