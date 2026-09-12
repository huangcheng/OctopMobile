import { StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";

import { PressableScale } from "@/src/components/PressableScale";
import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useI18n } from "@/src/i18n/I18nProvider";

/** Settings gear in large-title headers (designs 03/08/11/13). */
export function HeaderGear() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <PressableScale
      onPress={() => router.push("/settings")}
      contentStyle={[styles.button, { backgroundColor: C.bgElevated, borderColor: C.border }]}
      accessibilityRole="button"
      accessibilityLabel={t("settings.title")}
      testID="header-settings"
      hitSlop={12}
    >
      <SymbolView
        name={
          {
            ios: "gearshape",
            android: "settings",
            web: "settings",
          } as unknown as Parameters<typeof SymbolView>[0]["name"]
        }
        tintColor={C.textSecondary}
        size={18}
      />
      </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
