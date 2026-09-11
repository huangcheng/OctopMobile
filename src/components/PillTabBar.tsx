import { Pressable, StyleSheet, Text, View as RNView } from "react-native";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { MessageKey } from "@/src/i18n";

/**
 * Structural stand-in for @react-navigation's BottomTabBarProps (not re-exported
 * by expo-router at a stable path). Members are kept minimal and loose enough
 * that the full props object stays assignable.
 */
type PillTabBarProps = {
  state: {
    index: number;
    routes: ReadonlyArray<{ key: string; name: string }>;
  };
  navigation: {
    emit: (event: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented?: boolean };
    navigate: (name: string) => void | Promise<void>;
  };
  insets?: { top: number; right: number; bottom: number; left: number };
};

type TabIcon = { ios: string; android: string; web: string };

/**
 * Ardot component `PillTabBar` (node 4:312):
 * - Bar 351×62, pad 4, white fill, shadow 0 8 20 rgba(7,9,15,.10), radius 31
 * - Tabs: vertical stack (icon 18 + gap 3 + 10pt caps label), radius 26
 * - Active: brand fill + white glyph/label; idle: white fill + #9CA3AF
 * - Screen chrome `Bottom Bar`: pad H 21 / top 12 / bottom 21
 * Icons: ic/chat, ic/bot, ic/book, ic/alarm (SF/Material stand-ins).
 */
const TABS: Array<{ name: string; labelKey: MessageKey; icon: TabIcon }> = [
  {
    name: "chats",
    labelKey: "tabs.chats",
    icon: { ios: "message", android: "chat_bubble_outline", web: "chat_bubble_outline" },
  },
  {
    name: "experts",
    labelKey: "tabs.experts",
    // Design uses robot head (ic/bot); SF has no robot — cpu/desktop is closest.
    icon: { ios: "desktopcomputer", android: "smart_toy", web: "smart_toy" },
  },
  {
    name: "knowledge",
    labelKey: "tabs.knowledge",
    icon: { ios: "book", android: "menu_book", web: "menu_book" },
  },
  {
    name: "automation",
    labelKey: "tabs.automation",
    // Was `clock.alarm.fill` (invalid SF Symbol → missing glyph).
    icon: { ios: "alarm", android: "alarm", web: "alarm" },
  },
];

export function PillTabBar({ state, navigation, insets: navInsets }: PillTabBarProps) {
  const C = useOctopTheme();
  const { t } = useI18n();
  const hookInsets = useSafeAreaInsets();
  const bottomInset = Math.max(
    navInsets?.bottom ?? 0,
    hookInsets.bottom,
    initialWindowMetrics?.insets.bottom ?? 0,
  );
  // Ardot Bottom Bar padBottom 21; on device honor the larger home-indicator inset.
  const padBottom = Math.max(21, bottomInset);
  const focusedName = state.routes[state.index]?.name;

  return (
    <RNView
      pointerEvents="box-none"
      style={[styles.chrome, { paddingBottom: padBottom }]}
    >
      <RNView
        style={[
          styles.bar,
          {
            backgroundColor: C.bgElevated,
            boxShadow: "0px 8px 20px rgba(7, 9, 15, 0.10)",
          },
        ]}
        accessibilityRole="tablist"
      >
        {TABS.map((tab) => {
          const route =
            state.routes.find((r) => r.name === tab.name) ??
            state.routes.find((r) => r.name === `${tab.name}/index`) ??
            state.routes.find((r) => r.name.startsWith(`${tab.name}/`));
          const active =
            focusedName === tab.name || focusedName?.startsWith(`${tab.name}/`);

          const onPress = () => {
            if (!route) {
              void navigation.navigate(tab.name);
              return;
            }
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!active && !event?.defaultPrevented) {
              void navigation.navigate(route.name);
            }
          };

          const fg = active ? C.onBrand : C.textTertiary;

          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              style={[styles.tab, active && { backgroundColor: C.brand }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(tab.labelKey)}
            >
              <SymbolView
                name={tab.icon as unknown as Parameters<typeof SymbolView>[0]["name"]}
                tintColor={fg}
                size={18}
              />
              <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </RNView>
    </RNView>
  );
}

/** Total chrome height above the home indicator (padTop 12 + bar 62). Used by FAB. */
export const PILL_TAB_BAR_CONTENT_HEIGHT = 12 + 62;

const styles = StyleSheet.create({
  // Ardot `Bottom Bar`: pad H 21, top 12, bottom 21 (bottom overridden by inset).
  chrome: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 21,
    paddingTop: 12,
    zIndex: 50,
    elevation: 50,
  },
  bar: {
    height: 62,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 31,
    borderCurve: "continuous",
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 26,
    borderCurve: "continuous",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
