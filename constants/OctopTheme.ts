/**
 * Octop Design System tokens — default brand: Elegant Rose.
 * Light values mirror the Ardot `Octop Tokens` variable set (Light mode);
 * Dark values mirror the same set (Dark mode) + Octop dashboard theme-vars.
 * Snapshot: docs/design/tokens.json. Keep in sync with the Ardot file — it is the constitution.
 */

export type OctopThemeTokens = {
  /** Which base scheme these tokens came from; palettes never change it. */
  scheme: "light" | "dark";

  brand: string;
  /** Brand as foreground text/icon. Dark mode uses the palette's brightened
   * colorLink (dashboard ANTD_BRAND_TOKENS.dark) — the saturated primary is
   * unreadable on dark surfaces. Ardot `brand-text`; identical to `brand` in
   * light mode and for rose in both modes. */
  brandText: string;
  brandHover: string;
  brandActive: string;
  brandSoft: string;
  brandBg: string;
  brandBgStrong: string;
  brandBorder: string;
  brandShadow: string;
  onBrand: string;
  logo: string;

  bg: string;
  bgLayout: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgLogin: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textPlaceholder: string;

  border: string;
  borderSecondary: string;
  borderInput: string;

  assistantBubble: string;
  assistantBorder: string;

  codeBg: string;
  codeText: string;

  danger: string;
  dangerBg: string;
  dangerText: string;

  success: string;
  successBg: string;

  info: string;
  infoBg: string;

  warning: string;
  warningBg: string;
  warningBorder: string;

  cardShadow: string;
  scrim: string;
};

export const Octop: OctopThemeTokens = {
  scheme: "light",

  brand: "#E85D75",
  brandText: "#E85D75",
  brandHover: "#D14A62",
  brandActive: "#B83A50",
  brandSoft: "#FDE8EC",
  brandBg: "rgba(232, 93, 117, 0.06)",
  brandBgStrong: "rgba(232, 93, 117, 0.12)",
  brandBorder: "rgba(232, 93, 117, 0.22)",
  brandShadow: "rgba(232, 93, 117, 0.28)",
  onBrand: "#FFFFFF",
  logo: "#E05040",

  bg: "#FFFFFF",
  bgLayout: "#F5F6F8",
  bgSecondary: "#F7F8FA",
  bgTertiary: "#F0F1F3",
  bgElevated: "#FFFFFF",
  bgLogin: "#FBFAF9",

  text: "#111827",
  textSecondary: "#4B5563",
  textTertiary: "#9CA3AF",
  textPlaceholder: "#C0C5CE",

  border: "#E5E7EB",
  borderSecondary: "#F3F4F6",
  borderInput: "#D1D5DB",

  assistantBubble: "#FFF7F9",
  assistantBorder: "rgba(232, 93, 117, 0.14)",

  // Code cards follow the scheme, mirroring the Octop dashboard
  // (react-syntax-highlighter prism one-light / one-dark). Ardot: `code-bg`
  // / `code-text` variables + "Code Block / Themes" spec (frame 10:3).
  codeBg: "#F7F8FA",
  codeText: "#383A42",

  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  dangerText: "#B91C1C",

  success: "#10B981",
  successBg: "#ECFDF5",

  info: "#3B82F6",
  infoBg: "#EFF6FF",

  warning: "#D97706",
  warningBg: "#FFFBEB",
  warningBorder: "#FCD34D",

  cardShadow: "rgba(11, 18, 32, 0.04)",
  scrim: "rgba(0, 0, 0, 0.5)",
};

export const OctopDark: OctopThemeTokens = {
  scheme: "dark",

  brand: "#F08B9A",
  brandText: "#F08B9A",
  brandHover: "#E85D75",
  brandActive: "#D14A62",
  brandSoft: "rgba(232, 93, 117, 0.16)",
  brandBg: "rgba(232, 93, 117, 0.10)",
  brandBgStrong: "rgba(232, 93, 117, 0.18)",
  brandBorder: "rgba(240, 139, 154, 0.32)",
  brandShadow: "rgba(240, 139, 154, 0.25)",
  onBrand: "#FFFFFF",
  logo: "#F08B9A",

  bg: "#141414",
  bgLayout: "#0E0E0E",
  bgSecondary: "#1A1A1A",
  bgTertiary: "#222222",
  bgElevated: "#1E1E1E",
  bgLogin: "#0E0E0E",

  text: "rgba(255, 255, 255, 0.9)",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textTertiary: "rgba(255, 255, 255, 0.35)",
  textPlaceholder: "rgba(255, 255, 255, 0.16)",

  border: "rgba(255, 255, 255, 0.08)",
  borderSecondary: "rgba(255, 255, 255, 0.05)",
  borderInput: "rgba(255, 255, 255, 0.14)",

  assistantBubble: "#1A1A1A",
  assistantBorder: "rgba(255, 255, 255, 0.08)",

  codeBg: "#11161D",
  codeText: "#ABB2BF",

  danger: "#F87171",
  dangerBg: "rgba(239, 68, 68, 0.08)",
  dangerText: "#FCA5A5",

  success: "#34D399",
  successBg: "rgba(16, 185, 129, 0.08)",

  info: "#60A5FA",
  infoBg: "rgba(59, 130, 246, 0.08)",

  warning: "#FBBF24",
  warningBg: "rgba(251, 191, 36, 0.08)",
  warningBorder: "rgba(251, 191, 36, 0.3)",

  cardShadow: "rgba(0, 0, 0, 0.4)",
  scrim: "rgba(0, 0, 0, 0.6)",
};

export type OctopColor = (typeof Octop)[keyof typeof Octop];

/**
 * Brand palettes — orthogonal to light/dark, mirroring the Octop dashboard
 * (`dashboard/src/styles/themePalettes.ts`, pin v0.9.32): 8 curated primaries.
 * `rose` is the Ardot constitution default; the rest derive the brand family
 * from the dashboard's light/dark `colorPrimary` so Settings can offer them all.
 */
export type PaletteKey =
  | "rose"
  | "tech"
  | "indigo"
  | "teal"
  | "violet"
  | "emerald"
  | "amber"
  | "slate";

export const PALETTE_KEYS: PaletteKey[] = [
  "rose",
  "tech",
  "indigo",
  "teal",
  "violet",
  "emerald",
  "amber",
  "slate",
];

/** Dashboard `ANTD_BRAND_TOKENS[palette].{light,dark}.colorPrimary`. */
export const PALETTE_PRIMARY: Record<PaletteKey, { light: string; dark: string }> = {
  rose: { light: "#E85D75", dark: "#F08B9A" },
  tech: { light: "#3A5FE0", dark: "#3A5FE0" },
  indigo: { light: "#4F46E5", dark: "#4F46E5" },
  teal: { light: "#0F766E", dark: "#0F766E" },
  violet: { light: "#7C3AED", dark: "#7C3AED" },
  emerald: { light: "#047857", dark: "#047857" },
  amber: { light: "#B45309", dark: "#B45309" },
  slate: { light: "#475569", dark: "#475569" },
};

/** Dashboard `ANTD_BRAND_TOKENS[palette].{light,dark}.colorLink` — brand as
 * text on dark surfaces is the brightened variant, not the solid primary. */
export const PALETTE_LINK: Record<PaletteKey, { light: string; dark: string }> = {
  rose: { light: "#E85D75", dark: "#F08B9A" },
  tech: { light: "#3A5FE0", dark: "#7B9BFC" },
  indigo: { light: "#4F46E5", dark: "#818CF8" },
  teal: { light: "#0F766E", dark: "#2DD4BF" },
  violet: { light: "#7C3AED", dark: "#A78BFA" },
  emerald: { light: "#047857", dark: "#34D399" },
  amber: { light: "#B45309", dark: "#FBBF24" },
  slate: { light: "#475569", dark: "#94A3B8" },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(n: number): string {
  return Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
}

/** Mix `hex` toward `target` by weight t (0..1). */
function mix(hex: string, target: string, t: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return `#${a.map((v, i) => toHex(v + (b[i] - v) * t)).join("")}`;
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Overlay a palette's brand family onto the scheme base tokens. `rose` returns
 * the base untouched so the Ardot constitution values stay exact.
 */
export function applyPalette(
  base: OctopThemeTokens,
  palette: PaletteKey,
  dark: boolean,
): OctopThemeTokens {
  if (palette === "rose") {
    return base;
  }
  const primary = dark ? PALETTE_PRIMARY[palette].dark : PALETTE_PRIMARY[palette].light;
  const lightPrimary = PALETTE_PRIMARY[palette].light;
  const brand = {
    brand: primary,
    brandText: dark ? PALETTE_LINK[palette].dark : PALETTE_LINK[palette].light,
    brandHover: dark ? mix(primary, "#FFFFFF", 0.35) : mix(primary, "#000000", 0.08),
    brandActive: dark ? mix(primary, "#000000", 0.12) : mix(primary, "#000000", 0.18),
    brandSoft: dark ? rgba(lightPrimary, 0.16) : mix(primary, "#FFFFFF", 0.88),
    brandBg: rgba(lightPrimary, dark ? 0.1 : 0.06),
    brandBgStrong: rgba(lightPrimary, dark ? 0.18 : 0.12),
    brandBorder: rgba(dark ? primary : lightPrimary, dark ? 0.32 : 0.22),
    brandShadow: rgba(primary, dark ? 0.25 : 0.28),
    onBrand: "#FFFFFF",
    logo: primary,
    assistantBubble: dark ? base.assistantBubble : mix(primary, "#FFFFFF", 0.96),
    assistantBorder: rgba(lightPrimary, dark ? 0.08 : 0.14),
  };
  return { ...base, ...brand };
}
