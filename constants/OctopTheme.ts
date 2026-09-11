/**
 * Octop Design System tokens — default brand: Elegant Rose.
 * Light values mirror the Ardot `Octop Tokens` variable set (Light mode);
 * Dark values mirror the same set (Dark mode) + Octop dashboard theme-vars.
 * Snapshot: docs/design/tokens.json. Keep in sync with the Ardot file — it is the constitution.
 */

export type OctopThemeTokens = {
  brand: string;
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
  brand: "#E85D75",
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
  brand: "#F08B9A",
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
