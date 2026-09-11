import { StyleSheet, Text, View as RNView } from "react-native";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useI18n } from "@/src/i18n/I18nProvider";

/** Design 15 `Working`: blush pill, 14% rose border, brandActive 13pt Medium label. */
export function WorkingIndicator() {
  const C = useOctopTheme();
  const { t } = useI18n();
  return (
    <RNView
      style={[
        styles.container,
        { backgroundColor: C.assistantBubble, borderColor: C.assistantBorder },
      ]}
    >
      <Text style={[styles.label, { color: C.brandActive }]}>{t("chat.working")}</Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    height: 32,
    paddingHorizontal: 12,
    marginVertical: 2,
    gap: 8,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
});
