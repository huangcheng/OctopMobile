import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";

import { Text, View } from "@/components/Themed";
import { createThread, listThreads } from "@/src/api/threads";
import type { ApiError } from "@/src/api/http";
import type { ThreadSummary } from "@/src/api/types";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { t } from "@/src/i18n";

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as ApiError).code === "string"
  );
}

function mapThreadError(error: unknown): string {
  if (isApiError(error) && error.code === "NETWORK") {
    return t("errors.network");
  }
  return t("errors.network");
}

function threadTitle(thread: ThreadSummary): string {
  const title = thread.title?.trim();
  if (title) {
    return title;
  }
  return thread.thread_id.slice(0, 8);
}

function formatLastActive(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export default function TasksScreen() {
  const { api } = useAuth();
  const { selectedAgentId } = useSelectedAgent();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!selectedAgentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const list = await listThreads(api, selectedAgentId);
      setThreads(list);
    } catch (err) {
      setError(mapThreadError(err));
    } finally {
      setLoading(false);
    }
  }, [api, selectedAgentId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleCreateThread() {
    if (!selectedAgentId || creating) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const { thread_id } = await createThread(api, selectedAgentId);
      router.push(`/(tabs)/tasks/${thread_id}`);
    } catch (err) {
      setError(mapThreadError(err));
    } finally {
      setCreating(false);
    }
  }

  function handleOpenThread(threadId: string) {
    router.push(`/(tabs)/tasks/${threadId}`);
  }

  if (!selectedAgentId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noAgentText}>{t("tasks.noAgent")}</Text>
        <Pressable
          onPress={() => router.navigate("/(tabs)/experts")}
          style={({ pressed }) => [styles.chooseExpertButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.chooseExpertText}>{t("tasks.chooseExpert")}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && threads.length === 0) {
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
        data={threads}
        keyExtractor={(item) => item.thread_id}
        contentContainerStyle={threads.length === 0 ? styles.emptyList : undefined}
        ListHeaderComponent={
          <Pressable
            onPress={handleCreateThread}
            disabled={creating}
            style={({ pressed }) => [
              styles.newButton,
              pressed && styles.buttonPressed,
              creating && styles.newButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            {creating ? (
              <ActivityIndicator size="small" color="#2f95dc" />
            ) : (
              <Text style={styles.newButtonText}>{t("tasks.new")}</Text>
            )}
          </Pressable>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.emptyText}>{t("tasks.empty")}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleOpenThread(item.thread_id)}
            style={({ pressed }) => [styles.row, pressed && styles.buttonPressed]}
            accessibilityRole="button"
          >
            <RNView style={styles.rowContent}>
              <RNView style={styles.titleRow}>
                {item.pinned ? (
                  <SymbolView
                    name={{
                      ios: "pin.fill",
                      android: "push_pin",
                      web: "push_pin",
                    }}
                    tintColor="#2f95dc"
                    size={14}
                    style={styles.pinIcon}
                  />
                ) : null}
                <Text style={styles.title} numberOfLines={1}>
                  {threadTitle(item)}
                </Text>
              </RNView>
              <Text style={styles.lastActive}>{formatLastActive(item.last_active)}</Text>
            </RNView>
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
    padding: 24,
  },
  noAgentText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 16,
  },
  chooseExpertButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2f95dc",
  },
  chooseExpertText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  newButton: {
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2f95dc",
    alignItems: "center",
  },
  newButtonDisabled: {
    opacity: 0.6,
  },
  newButtonText: {
    color: "#2f95dc",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.6,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  rowContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinIcon: {
    marginRight: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
  },
  lastActive: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
