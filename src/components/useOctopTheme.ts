import { useMemo } from "react";

import { useColorScheme } from "@/components/useColorScheme";

import {
  applyPalette,
  Octop,
  OctopDark,
  type OctopThemeTokens,
} from "@/constants/OctopTheme";
import { usePalette } from "@/src/features/theme/paletteStore";

/**
 * Scheme-aware Octop design tokens (Light + Dark from the Ardot `Octop Tokens` set),
 * overlaid with the selected brand palette (Octop dashboard `themePalettes`).
 * Use this instead of hardcoding hex values or lightColor/darkColor props.
 */
export function useOctopTheme(): OctopThemeTokens {
  const scheme = useColorScheme();
  const palette = usePalette();
  const dark = scheme === "dark";
  return useMemo(() => applyPalette(dark ? OctopDark : Octop, palette, dark), [dark, palette]);
}
