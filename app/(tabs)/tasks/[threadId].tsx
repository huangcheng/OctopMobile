import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { t } from "@/src/i18n";

export default function ThreadChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.threadId}>{threadId}</Text>
      <Text style={styles.placeholder}>{t("tasks.chatStub")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  threadId: {
    fontSize: 14,
    opacity: 0.5,
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
});
