import { describe, expect, it } from "@jest/globals";
import { expertGlyphForName, resolveAgentIconUrl } from "@/src/utils/expertIcon";

describe("expertGlyphForName", () => {
  it("maps known Lucide keys", () => {
    expect(expertGlyphForName("zap").ios).toBe("bolt.fill");
    expect(expertGlyphForName("code").android).toBe("code");
  });

  it("falls back for unknown / empty", () => {
    expect(expertGlyphForName("nope").ios).toContain("stack");
    expect(expertGlyphForName(null).ios).toContain("stack");
  });
});

describe("resolveAgentIconUrl", () => {
  it("joins relative avatar paths", () => {
    expect(resolveAgentIconUrl("http://10.0.0.1:9000", "/api/agents/X/avatar?v=1")).toBe(
      "http://10.0.0.1:9000/api/agents/X/avatar?v=1",
    );
  });

  it("passes through absolute urls", () => {
    expect(resolveAgentIconUrl("http://x", "https://cdn.example/a.png")).toBe(
      "https://cdn.example/a.png",
    );
  });

  it("returns null when missing", () => {
    expect(resolveAgentIconUrl("http://x", null)).toBeNull();
    expect(resolveAgentIconUrl(null, "/api/agents/X/avatar")).toBeNull();
  });
});
