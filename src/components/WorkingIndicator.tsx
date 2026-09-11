import { ActivityIndicator, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { t } from "@/src/i18n";

export function WorkingIndicator() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#666" />
      <Text style={styles.label}>{t("chat.working")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 4,
    gap: 8,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
});
