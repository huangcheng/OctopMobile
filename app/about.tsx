import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View as RNView, ScrollView } from "react-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useI18n } from "@/src/i18n/I18nProvider";

type SFSymbol = Parameters<typeof SymbolView>[0]["name"];

type OssRow = { key: string; name: string; meta: string; url?: string };

const OSS_ROWS: OssRow[] = [
  { key: "octop", name: "Octop", meta: "TencentCloud", url: "https://github.com/TencentCloud/Octop" },
  { key: "octop-mobile", name: "Octop Mobile", meta: "huangcheng", url: "https://github.com/huangcheng/OctopMobile" },
  { key: "expo", name: "Expo", meta: "MIT" },
  { key: "rn", name: "React Native", meta: "MIT" },
];

/** About / copyright (Ardot `iPhone / About` 8:33): hero, LEGAL card, OPEN SOURCE card. */
export default function AboutScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <RNView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow-back", web: "arrow_back" } as unknown as SFSymbol}
            tintColor={C.brand}
            size={20}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>{t("about.title")}</Text>
      </RNView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <RNView style={styles.hero}>
          <RNView style={[styles.logoMark, { boxShadow: "0px 8px 16px rgba(255, 75, 78, 0.30)" }]}>
            <Image
              source={require("@/assets/images/pwa-512.png")}
              style={styles.logoImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </RNView>
          <Text style={[styles.heroName, { color: C.text }]}>Octop</Text>
          <Text style={[styles.heroVersion, { color: C.textTertiary }]}>
            {t("settings.version")}
          </Text>
        </RNView>

        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{t("about.legal")}</Text>
        <RNView
          style={[
            styles.card,
            {
              backgroundColor: C.bgElevated,
              borderColor: C.border,
              boxShadow: `0px 1px 3px ${C.cardShadow}`,
            },
          ]}
        >
          <Text style={[styles.copyright, { color: C.text }]}>{t("about.copyright")}</Text>
          <Text style={[styles.disclaimer, { color: C.textSecondary }]}>
            {t("about.disclaimer")}
          </Text>
        </RNView>

        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{t("about.oss")}</Text>
        <RNView
          style={[
            styles.card,
            styles.ossCard,
            {
              backgroundColor: C.bgElevated,
              borderColor: C.border,
              boxShadow: `0px 1px 3px ${C.cardShadow}`,
            },
          ]}
        >
          {OSS_ROWS.map((row, index) => (
            <RNView key={row.key}>
              {index > 0 ? (
                <RNView style={[styles.divider, { backgroundColor: C.borderSecondary }]} />
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.ossRow, pressed && row.url && styles.pressed]}
                onPress={row.url ? () => void WebBrowser.openBrowserAsync(row.url as string) : undefined}
                disabled={!row.url}
                accessibilityRole={row.url ? "link" : "text"}
                accessibilityLabel={row.url ? `${row.name} — ${row.url}` : row.name}
              >
                <Text style={[styles.ossName, { color: C.text }]}>{row.name}</Text>
                <Text style={[styles.ossMeta, { color: C.textTertiary }]}>{row.meta}</Text>
                {row.url ? (
                  <SymbolView
                    name={{ ios: "arrow.up.right", android: "north_east", web: "north_east" } as unknown as SFSymbol}
                    tintColor={C.textTertiary}
                    size={14}
                  />
                ) : null}
              </Pressable>
            </RNView>
          ))}
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingRight: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "600",
  },
  heroVersion: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  copyright: {
    fontSize: 14,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 13,
    lineHeight: 19,
  },
  ossCard: {
    paddingTop: 6,
    paddingBottom: 6,
    gap: 0,
  },
  ossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  ossName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  ossMeta: {
    fontSize: 12,
  },
  divider: {
    height: 1,
  },
});
