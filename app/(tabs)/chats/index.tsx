import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { HeaderGear } from "@/src/components/HeaderGear";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { SkeletonList } from "@/src/components/SkeletonList";
import { AgentTile } from "@/src/components/AgentTile";
import { ActionSheet } from "@/src/components/ActionSheet";
import { useToast } from "@/src/components/Toast";
import { listThreads, updateThread, deleteThread } from "@/src/api/threads";
import type { Agent, ThreadSummary } from "@/src/api/types";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor, tileInitial } from "@/src/utils/color";
import {
  formatRelativeTime,
  greetingKeyFor,
  timeGroupOf,
  type TimeGroup,
} from "@/src/utils/time";

type ThreadRow = {
  thread: ThreadSummary;
  agent: Agent;
};

function threadTitle(thread: ThreadSummary, untitled: string): string {
  const title = thread.title?.trim();
  // Never surface raw thread ids (thr_01…) as the session name.
  if (!title || /^thr[_-]/i.test(title)) {
    return untitled;
  }
  return title;
}

/** Design 03: cross-agent conversation list with greeting, chips, Today/Earlier. */
export default function ChatsScreen() {
  const C = useOctopTheme();
  const { t, locale } = useI18n();
  const { api, user } = useAuth();
  const { agents, selectedAgentId, selectAgent, refresh: refreshAgents } = useSelectedAgent();
  const toast = useToast();

  const [rows, setRows] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [sheetRow, setSheetRow] = useState<ThreadRow | null>(null);
  const [renameRow, setRenameRow] = useState<ThreadRow | null>(null);
  const [renameText, setRenameText] = useState("");
  // Only user-initiated pull-to-refresh drives `refreshing`; silent focus
  // refreshes must not (iOS parks a ~70pt offset for the spinner otherwise).
  const [pulling, setPulling] = useState(false);
  const refreshGen = useRef(0);

  const refresh = useCallback(async () => {
    if (agents.length === 0) {
      await refreshAgents();
      return;
    }
    const gen = ++refreshGen.current;
    setLoading(true);
    setError(null);
    try {
      const lists = await Promise.all(
        agents.map(async (agent) => {
          try {
            const threads = await listThreads(api, agent.agent_id);
            return threads.map((thread) => ({ thread, agent }));
          } catch {
            return [] as ThreadRow[];
          }
        }),
      );
      if (gen !== refreshGen.current) {
        return;
      }
      // Dedupe by thread_id (defensive) — never append across focus refreshes.
      const byId = new Map<string, ThreadRow>();
      for (const row of lists.flat()) {
        byId.set(row.thread.thread_id, row);
      }
      const merged = [...byId.values()].sort((a, b) =>
        a.thread.last_active < b.thread.last_active ? 1 : -1,
      );
      setRows(merged);
    } catch {
      if (gen === refreshGen.current) {
        setError(t("errors.network"));
      }
    } finally {
      if (gen === refreshGen.current) {
        setLoading(false);
      }
    }
  }, [agents, api, refreshAgents, t]);

  async function handlePull() {
    setPulling(true);
    await refresh();
    setPulling(false);
  }

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        // Invalidate in-flight work so a stale response can't append/overwrite.
        refreshGen.current += 1;
      };
    }, [refresh]),
  );

  const filtered = useMemo(
    () => (filterAgent ? rows.filter((row) => row.agent.agent_id === filterAgent) : rows),
    [rows, filterAgent],
  );

  const sections = useMemo(() => {
    const today: ThreadRow[] = [];
    const earlier: ThreadRow[] = [];
    for (const row of filtered) {
      (timeGroupOf(row.thread.last_active) === "today" ? today : earlier).push(row);
    }
    return [
      { key: "today" as TimeGroup, label: t("chats.today"), data: today },
      { key: "earlier" as TimeGroup, label: t("chats.earlier"), data: earlier },
    ].filter((section) => section.data.length > 0);
  }, [filtered, t]);

  const listData = useMemo(
    () =>
      sections.flatMap((section): Array<{ type: "header"; label: string } | { type: "row"; row: ThreadRow }> => [
        { type: "header", label: section.label },
        ...section.data.map((row) => ({ type: "row" as const, row })),
      ]),
    [sections],
  );

  const runningCount = agents.filter((a) => (a.state ?? "").toLowerCase() === "running").length;
  const unreadTotal = agents.reduce((sum, a) => sum + (a.unread_count ?? 0), 0);
  const userName = user?.display_name || user?.username || "you";

  const greetingKey =
    greetingKeyFor() === "morning"
      ? "chats.greetingMorning"
      : greetingKeyFor() === "afternoon"
        ? "chats.greetingAfternoon"
        : "chats.greetingEvening";

  function openThread(row: ThreadRow) {
    router.push({
      pathname: "/chat/[threadId]",
      params: {
        threadId: row.thread.thread_id,
        agentId: row.agent.agent_id,
        name: row.agent.name,
        title: threadTitle(row.thread, t("chats.untitled")),
      },
    });
  }

  async function handleNew() {
    const agentId = selectedAgentId ?? agents[0]?.agent_id;
    if (!agentId) {
      router.navigate("/(tabs)/experts");
      return;
    }
    const agent = agents.find((a) => a.agent_id === agentId);
    if (selectedAgentId !== agentId && agentId) {
      await selectAgent(agentId);
    }
    router.push({
      pathname: "/chat/new",
      params: { agentId, name: agent?.name ?? "" },
    });
  }

  async function togglePin(row: ThreadRow) {
    const nextPinned = !row.thread.pinned;
    try {
      await updateThread(api, row.agent.agent_id, row.thread.thread_id, {
        pinned: nextPinned,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.thread.thread_id === row.thread.thread_id
            ? { ...r, thread: { ...r.thread, pinned: nextPinned } }
            : r,
        ),
      );
      toast.show({
        kind: "success",
        message: nextPinned ? t("feedback.pinned") : t("feedback.unpinned"),
      });
    } catch {
      toast.show({ kind: "error", message: t("errors.actionFailed") });
    }
  }

  async function handleDelete(row: ThreadRow) {
    try {
      await deleteThread(api, row.agent.agent_id, row.thread.thread_id);
      setRows((prev) => prev.filter((r) => r.thread.thread_id !== row.thread.thread_id));
      toast.show({ kind: "success", message: t("feedback.threadDeleted") });
    } catch {
      toast.show({ kind: "error", message: t("errors.actionFailed") });
    }
  }

  async function submitRename() {
    const row = renameRow;
    const title = renameText.trim();
    if (!row || !title) {
      setRenameRow(null);
      return;
    }
    setRenameRow(null);
    try {
      await updateThread(api, row.agent.agent_id, row.thread.thread_id, { title });
      setRows((prev) =>
        prev.map((r) =>
          r.thread.thread_id === row.thread.thread_id
            ? { ...r, thread: { ...r.thread, title } }
            : r,
        ),
      );
      toast.show({ kind: "success", message: t("feedback.renamed") });
    } catch {
      toast.show({ kind: "error", message: t("errors.actionFailed") });
    }
  }

  const hasData = agents.length > 0;

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <ScreenHeader
        title={t("chats.title")}
        action={
          <RNView style={styles.headerActions}>
            <Pressable
              onPress={handleNew}
              style={({ pressed }) => [
                styles.newPill,
                { backgroundColor: C.brand },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("chats.new")}
            >
              <Text style={[styles.newPillText, { color: C.onBrand }]}>{t("chats.new")}</Text>
            </Pressable>
            <HeaderGear />
          </RNView>
        }
      />

      {hasData ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}
        >
          {[{ agent_id: "__all__", name: t("chats.filterAll") } as unknown as Agent, ...agents].map(
            (agent) => {
              const value = agent.agent_id === "__all__" ? null : agent.agent_id;
              const selected = filterAgent === value;
              return (
                <Pressable
                  key={agent.agent_id}
                  onPress={() => setFilterAgent(value)}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: selected ? C.brandSoft : C.bgTertiary },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selected ? C.brand : C.textSecondary,
                        fontWeight: selected ? "600" : "500",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {agent.name}
                  </Text>
                </Pressable>
              );
            },
          )}
        </ScrollView>
      ) : null}

      {hasData ? (
        <RNView style={styles.greetingWrap}>
          <RNView
            style={[
              styles.greeting,
              {
                backgroundColor: C.bgElevated,
                borderColor: C.border,
                boxShadow: `0px 1px 3px ${C.cardShadow}`,
              },
            ]}
          >
            <Image
              source={require("@/assets/images/octop-mascot-tasks-trim.png")}
              style={styles.greetingMascot}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <RNView style={styles.greetingBody}>
              <Text style={[styles.greetingTitle, { color: C.text }]}>
                {t(greetingKey, { name: userName })}
              </Text>
              <Text style={[styles.greetingMeta, { color: C.textTertiary }]}>
                {t("chats.stats", { running: runningCount, unread: unreadTotal })}
              </Text>
            </RNView>
          </RNView>
        </RNView>
      ) : null}

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {loading && rows.length === 0 && hasData ? (
        <RNView style={styles.skeletonWrap}>
          <SkeletonList rows={4} />
        </RNView>
      ) : null}

      {!hasData && !loading ? (
        <EmptyState
          title={t("chats.emptyTitle")}
          subtitle={t("chats.emptySubtitle")}
          ctaLabel={t("chats.emptyCta")}
          onCta={() => router.navigate("/(tabs)/experts")}
        />
      ) : null}

      {hasData && !loading && rows.length === 0 && !error ? (
        <EmptyState
          title={t("chats.emptyTitle")}
          subtitle={t("chats.emptySubtitle")}
          ctaLabel={t("chats.emptyCta")}
          onCta={() => router.navigate("/(tabs)/experts")}
        />
      ) : null}

      {rows.length > 0 ? (
        <FlatList<typeof listData[number]>
          style={styles.listFlex}
          data={listData}
          keyExtractor={(item) =>
            item.type === "header"
              ? `h-${item.label}`
              : `${item.row.agent.agent_id}:${item.row.thread.thread_id}`
          }
          refreshControl={
            <RefreshControl refreshing={pulling} onRefresh={handlePull} tintColor={C.brand} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          // Avoid contentContainerStyle `gap` — FlatList remount/focus can stack rows.
          ItemSeparatorComponent={() => <RNView style={styles.separator} />}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{item.label}</Text>
              );
            }
            const { row: item2 } = item;
            const untitled = t("chats.untitled");
            const meta = [
              item2.agent.name,
              formatRelativeTime(item2.thread.last_active, locale),
            ].join(" · ");
            const unread =
              item2.thread.is_active && (item2.agent.unread_count ?? 0) > 0
                ? item2.agent.unread_count ?? 0
                : null;

            return (
              <Pressable
                onPress={() => openThread(item2)}
                onLongPress={() => setSheetRow(item2)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: C.bgElevated,
                    borderColor: C.border,
                    boxShadow: `0px 1px 3px ${C.cardShadow}`,
                  },
                  pressed && { backgroundColor: C.bgTertiary },
                ]}
                accessibilityRole="button"
                accessibilityLabel={threadTitle(item2.thread, untitled)}
              >
                <AgentTile
                  label={tileInitial(item2.agent.name)}
                  color={tileColor(item2.agent.color, item2.agent.agent_id)}
                  iconUrl={item2.agent.icon_url}
                  iconName={item2.agent.icon_name}
                />
                <RNView style={styles.cardBody}>
                  <RNView style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>
                      {threadTitle(item2.thread, untitled)}
                    </Text>
                    {item2.thread.pinned ? (
                      <SymbolView
                        name={
                          {
                            ios: "pin.fill",
                            android: "push_pin",
                            web: "push_pin",
                          } as unknown as Parameters<typeof SymbolView>[0]["name"]
                        }
                        tintColor={C.textTertiary}
                        size={12}
                      />
                    ) : null}
                  </RNView>
                  <Text style={[styles.cardMeta, { color: C.textTertiary }]} numberOfLines={1}>
                    {meta}
                  </Text>
                </RNView>
                {unread ? (
                  <RNView style={[styles.badge, { backgroundColor: C.brand }]}>
                    <Text style={[styles.badgeText, { color: C.onBrand }]}>{unread}</Text>
                  </RNView>
                ) : null}
              </Pressable>
            );
          }}
        />
      ) : null}

      <ActionSheet
        visible={sheetRow !== null}
        title={sheetRow ? threadTitle(sheetRow.thread, t("chats.untitled")) : undefined}
        onDismiss={() => setSheetRow(null)}
        actions={
          sheetRow
            ? [
                {
                  key: "pin",
                  label: sheetRow.thread.pinned ? t("chats.unpin") : t("chats.pin"),
                  icon: { ios: "pin", android: "push_pin", web: "push_pin" },
                  onPress: () => void togglePin(sheetRow),
                },
                {
                  key: "rename",
                  label: t("chats.rename"),
                  icon: { ios: "pencil", android: "edit", web: "edit" },
                  onPress: () => {
                    setRenameText(threadTitle(sheetRow.thread, t("chats.untitled")));
                    setRenameRow(sheetRow);
                  },
                },
                {
                  key: "delete",
                  label: t("chats.delete"),
                  icon: { ios: "trash", android: "delete", web: "delete" },
                  destructive: true,
                  onPress: () => void handleDelete(sheetRow),
                },
              ]
            : []
        }
      />

      <Modal transparent visible={renameRow !== null} animationType="fade" onRequestClose={() => setRenameRow(null)}>
        <RNView style={[styles.dialogScrim, { backgroundColor: C.scrim }]}>
          <RNView style={[styles.dialog, { backgroundColor: C.bgElevated }]}>
            <Text style={[styles.dialogTitle, { color: C.text }]}>{t("chats.renameTitle")}</Text>
            <TextInput
              style={[styles.dialogInput, { borderColor: C.borderInput, color: C.text }]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitRename}
            />
            <RNView style={styles.dialogRow}>
              <Pressable
                onPress={() => setRenameRow(null)}
                style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}
              >
                <Text style={[styles.dialogCancel, { color: C.textSecondary }]}>
                  {t("chats.cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={submitRename}
                style={({ pressed }) => [
                  styles.dialogButton,
                  { backgroundColor: C.brand },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.dialogSave, { color: C.onBrand }]}>
                  {t("chats.renameSave")}
                </Text>
              </Pressable>
            </RNView>
          </RNView>
        </RNView>
      </Modal>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  newPill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  newPillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greetingWrap: {
    paddingHorizontal: 16,
  },
  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  greetingMascot: {
    width: 48,
    height: 48,
  },
  greetingBody: {
    flex: 1,
    gap: 2,
  },
  greetingTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  greetingMeta: {
    fontSize: 12,
  },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 40,
  },
  chips: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
  chip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderCurve: "continuous",
    justifyContent: "center",
    maxWidth: 160,
  },
  chipText: {
    fontSize: 12,
  },
  skeletonWrap: {
    marginTop: 4,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    paddingTop: 4,
  },
  separator: {
    height: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 14,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  cardMeta: {
    fontSize: 12,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dialogScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  dialog: {
    width: "100%",
    borderRadius: 20,
    borderCurve: "continuous",
    padding: 20,
    gap: 14,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  dialogRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  dialogButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    borderCurve: "continuous",
  },
  dialogCancel: {
    fontSize: 15,
    fontWeight: "600",
  },
  dialogSave: {
    fontSize: 15,
    fontWeight: "700",
  },
});
