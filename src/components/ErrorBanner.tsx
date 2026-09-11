import { Pressable, StyleSheet, Text, View as RNView } from "react-native";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useI18n } from "@/src/i18n/I18nProvider";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const C = useOctopTheme();
  const { t } = useI18n();
  return (
    <RNView style={[styles.banner, { backgroundColor: C.dangerBg, borderBottomColor: C.dangerBg }]}>
      <Text style={[styles.message, { color: C.dangerText }]} numberOfLines={3}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <Text style={[styles.retry, { color: C.brand }]}>{t("chat.retry")}</Text>
        </Pressable>
      ) : null}
    </RNView>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  retry: {
    marginLeft: 12,
    fontWeight: "700",
    fontSize: 14,
  },
});
