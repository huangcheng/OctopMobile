import { describe, expect, it } from "@jest/globals";
import { tileColor, tileInitial } from "@/src/utils/color";

describe("tileColor", () => {
  it("uses a valid server-provided hex", () => {
    expect(tileColor("#123ABC", "any")).toBe("#123ABC");
  });

  it("rejects malformed server colors and falls back to a stable palette color", () => {
    expect(tileColor("rose", "agent-1")).toBe(tileColor("rose", "agent-1"));
    expect(tileColor("  ", "agent-2")).toBe(tileColor(null, "agent-2"));
  });

  it("different keys can map to different palette entries", () => {
    const colors = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((key) => tileColor(null, key)),
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("tileInitial", () => {
  it("uppercases the first letter", () => {
    expect(tileInitial("coding coach")).toBe("C");
  });

  it("handles CJK first characters", () => {
    expect(tileInitial("老钱")).toBe("老");
  });

  it("falls back on empty names", () => {
    expect(tileInitial("")).toBe("?");
    expect(tileInitial(null)).toBe("?");
  });
});
