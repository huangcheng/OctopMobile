import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View as RNView,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { t } from "@/src/i18n";
import type { Agent } from "@/src/api/types";

export default function ExpertsScreen() {
  const { agents, selectedAgentId, loading, error, selectAgent, refresh } = useSelectedAgent();

  async function handleSelect(agent: Agent) {
    await selectAgent(agent.agent_id);
    router.navigate("/(tabs)/tasks");
  }

  if (loading && agents.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      <FlatList
        data={agents}
        keyExtractor={(item) => item.agent_id}
        contentContainerStyle={agents.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.emptyText}>{t("experts.empty")}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item)}
            style={({ pressed }) => [
              styles.row,
              item.agent_id === selectedAgentId && styles.rowSelected,
              pressed && styles.rowPressed,
            ]}
            accessibilityRole="button"
          >
            <RNView style={styles.rowContent}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </RNView>
            {(item.unread_count ?? 0) > 0 ? (
              <RNView style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread_count}</Text>
              </RNView>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  rowSelected: {
    backgroundColor: "rgba(47, 149, 220, 0.08)",
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.6,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2f95dc",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
