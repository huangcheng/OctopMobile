import { ActivityIndicator, StyleSheet, Text, View as RNView } from "react-native";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useI18n } from "@/src/i18n/I18nProvider";

export function WorkingIndicator() {
  const C = useOctopTheme();
  const { t } = useI18n();
  return (
    <RNView
      style={[
        styles.container,
        { backgroundColor: C.brandBg, borderColor: C.brandBorder },
      ]}
    >
      <ActivityIndicator size="small" color={C.brand} />
      <Text style={[styles.label, { color: C.textSecondary }]}>{t("chat.working")}</Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 2,
    marginLeft: 4,
    gap: 8,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
});
