import { describe, expect, it } from "@jest/globals";
import { applyPalette, Octop, OctopDark, PALETTE_KEYS, PALETTE_PRIMARY } from "@/constants/OctopTheme";

describe("applyPalette", () => {
  it("returns the constitution base untouched for rose (both schemes)", () => {
    expect(applyPalette(Octop, "rose", false)).toBe(Octop);
    expect(applyPalette(OctopDark, "rose", true)).toBe(OctopDark);
  });

  it("covers all 8 curated dashboard palettes with distinct primaries", () => {
    expect(PALETTE_KEYS).toHaveLength(8);
    const lights = new Set(PALETTE_KEYS.map((k) => PALETTE_PRIMARY[k].light));
    expect(lights.size).toBe(8);
  });

  it("derives the light brand family for tech", () => {
    const C = applyPalette(Octop, "tech", false);
    expect(C.brand).toBe("#3A5FE0");
    // brandSoft = brand mixed 88% toward white (235.8 → 236 = EC).
    expect(C.brandSoft).toBe("#E7ECFB");
    expect(C.brandBg).toBe("rgba(58, 95, 224, 0.06)");
    expect(C.brandShadow).toBe("rgba(58, 95, 224, 0.28)");
    expect(C.onBrand).toBe("#FFFFFF");
  });

  it("derives the dark brand family with alpha soft surfaces", () => {
    const C = applyPalette(OctopDark, "tech", true);
    expect(C.brand).toBe("#3A5FE0");
    expect(C.brandSoft).toBe("rgba(58, 95, 224, 0.16)");
    expect(C.brandBg).toBe("rgba(58, 95, 224, 0.1)");
    expect(C.brandBorder.startsWith("rgba(")).toBe(true);
  });

  it("only overlays the brand family; surfaces/text stay from the base", () => {
    const C = applyPalette(Octop, "emerald", false);
    expect(C.bgLayout).toBe(Octop.bgLayout);
    expect(C.text).toBe(Octop.text);
    expect(C.border).toBe(Octop.border);
    expect(C.success).toBe(Octop.success);
    expect(C.codeBg).toBe(Octop.codeBg);
  });

  it("darkens hover / active steps in light mode", () => {
    const C = applyPalette(Octop, "violet", false);
    expect(C.brandHover).not.toBe(C.brand);
    expect(C.brandActive).not.toBe(C.brandHover);
  });
});
