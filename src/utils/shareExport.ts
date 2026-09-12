import type { HistoryMessage } from "@/src/api/types";

function messageText(message: HistoryMessage): string {
  const content = message.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((block) => (typeof block?.text === "string" ? block.text : ""))
      .join("")
      .trim();
  }
  return "";
}

/**
 * Render a thread's history as shareable Markdown (design 07 "Share as
 * Markdown" + design 23 reader CTA): `# title`, then labeled turns.
 */
export function threadToMarkdown(title: string, messages: HistoryMessage[]): string {
  const header = `# ${title || "Conversation"}\n`;
  const turns = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && messageText(m))
    .map((m) => {
      const who = m.role === "user" ? "🧑 User" : "🐙 Assistant";
      return `**${who}**\n\n${messageText(m)}\n`;
    });
  return `${header}\n${turns.join("\n")}`.trim();
}
