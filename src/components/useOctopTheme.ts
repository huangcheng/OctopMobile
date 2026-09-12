import { useMemo } from "react";

import { useColorScheme } from "@/components/useColorScheme";

import {
  applyPalette,
  Octop,
  OctopDark,
  type OctopThemeTokens,
} from "@/constants/OctopTheme";
import { usePalette } from "@/src/features/theme/paletteStore";
import { resolveScheme, useThemeMode } from "@/src/features/theme/themeModeStore";

/**
 * Effective color scheme (in-app override via Settings ▸ Appearance, else OS).
 * Re-exported for navigation chrome (`app/_layout.tsx`).
 */
export function useOctopColorScheme(): "light" | "dark" {
  const osScheme = useColorScheme();
  const mode = useThemeMode();
  return resolveScheme(mode, osScheme);
}

/**
 * Scheme-aware Octop design tokens (Light + Dark from the Ardot `Octop Tokens` set),
 * overlaid with the selected brand palette (Octop dashboard `themePalettes`).
 * Use this instead of hardcoding hex values or lightColor/darkColor props.
 */
export function useOctopTheme(): OctopThemeTokens {
  const scheme = useOctopColorScheme();
  const palette = usePalette();
  const dark = scheme === "dark";
  return useMemo(() => applyPalette(dark ? OctopDark : Octop, palette, dark), [dark, palette]);
}
