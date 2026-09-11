import { useColorScheme } from "@/components/useColorScheme";

import { Octop, OctopDark, type OctopThemeTokens } from "@/constants/OctopTheme";

/**
 * Scheme-aware Octop design tokens (Light + Dark from the Ardot `Octop Tokens` set).
 * Use this instead of hardcoding hex values or lightColor/darkColor props.
 */
export function useOctopTheme(): OctopThemeTokens {
  const scheme = useColorScheme();
  return scheme === "dark" ? OctopDark : Octop;
}
