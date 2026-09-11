import { Pressable, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { t } from "@/src/i18n";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={styles.retry}>{t("chat.retry")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fdecea",
  },
  message: {
    flex: 1,
    color: "#b00020",
    fontSize: 14,
  },
  retry: {
    marginLeft: 12,
    color: "#2f95dc",
    fontWeight: "600",
    fontSize: 14,
  },
});
