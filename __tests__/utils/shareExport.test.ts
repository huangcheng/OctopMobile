import { describe, expect, it } from "@jest/globals";
import { threadToMarkdown } from "@/src/utils/shareExport";

describe("threadToMarkdown", () => {
  it("renders a titled thread with labeled turns", () => {
    const md = threadToMarkdown("Refactor plan", [
      { role: "user", content: "Break this into steps" },
      { role: "assistant", content: "1. Audit\n2. Slice" },
    ]);
    expect(md).toContain("# Refactor plan");
    expect(md).toContain("**🧑 User**");
    expect(md).toContain("Break this into steps");
    expect(md).toContain("**🐙 Assistant**");
    expect(md).toContain("1. Audit");
  });

  it("flattens content blocks and skips non-chat roles / empty turns", () => {
    const md = threadToMarkdown("", [
      { role: "user", content: [{ type: "text", text: "hello " }, { type: "text", text: "world" }] },
      { role: "tool", content: "ignored" },
      { role: "assistant", content: [] },
    ]);
    expect(md).toContain("hello world");
    expect(md).not.toContain("ignored");
    expect(md).toContain("# Conversation");
  });
});
