import { Octop, OctopDark } from "./OctopTheme";

export default {
  light: {
    text: Octop.text,
    background: Octop.bgLayout,
    tint: Octop.brand,
    tabIconDefault: Octop.textTertiary,
    tabIconSelected: Octop.brand,
    layout: Octop.bgLayout,
    border: Octop.border,
    card: Octop.bg,
  },
  dark: {
    text: OctopDark.text,
    background: OctopDark.bgLayout,
    tint: OctopDark.brand,
    tabIconDefault: OctopDark.textTertiary,
    tabIconSelected: OctopDark.brand,
    layout: OctopDark.bgLayout,
    border: OctopDark.border,
    card: OctopDark.bg,
  },
};
