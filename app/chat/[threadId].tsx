import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View as RNView,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SymbolView } from "expo-symbols";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { MarkdownBubble } from "@/src/components/MarkdownBubble";
import { PressableScale } from "@/src/components/PressableScale";
import { StreamingBubble } from "@/src/components/StreamingBubble";
import { WorkingIndicator } from "@/src/components/WorkingIndicator";
import { ProcessCard } from "@/src/components/ProcessCard";
import { AgentTile } from "@/src/components/AgentTile";
import { ActionSheet } from "@/src/components/ActionSheet";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useChatTurn, type ChatDisplayMessage } from "@/src/features/chat/useChatTurn";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor, tileInitial } from "@/src/utils/color";

type ListItem = ChatDisplayMessage | { id: string; streaming: true };

/** Chat screen (designs 15–16): header with agent status, markdown stream, process card, composer. */
export default function ThreadChatScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  const { threadId, agentId: agentIdParam, name, title, pendingMessage } = useLocalSearchParams<{
    threadId: string;
    agentId?: string;
    name?: string;
    title?: string;
    pendingMessage?: string;
  }>();
  const { agents, selectedAgentId, selectAgent } = useSelectedAgent();
  const { } = useAuth();

  const effectiveAgentId = agentIdParam ?? selectedAgentId;
  const agent = agents.find((a) => a.agent_id === effectiveAgentId);
  const agentName = name ?? agent?.name ?? "";

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const pendingSentRef = useRef(false);
  const listRef = useRef<FlatList<ListItem>>(null);

  function openConsole() {
    router.push({
      pathname: "/console",
      params: { path: "/knowledge-bases", title: t("chat.attachKb") },
    });
  }

  const {
    messages,
    streamingText,
    working,
    turnActive,
    disconnected,
    send,
    stop,
    reconnect,
    error,
    historyLoading,
    process,
  } = useChatTurn({
    agentId: effectiveAgentId,
    threadId: threadId ?? "",
  });

  useEffect(() => {
    if (effectiveAgentId && selectedAgentId !== effectiveAgentId) {
      void selectAgent(effectiveAgentId);
    }
  }, [effectiveAgentId, selectedAgentId, selectAgent]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending || turnActive) {
      return;
    }

    setSending(true);
    setDraft("");
    Keyboard.dismiss();

    try {
      await send(text);
    } finally {
      setSending(false);
    }
  }

  // A first message can be passed in when the thread was just created (chat/new).
  useEffect(() => {
    if (!pendingMessage || pendingSentRef.current || historyLoading || !threadId) {
      return;
    }
    if (messages.length > 0 || turnActive) {
      pendingSentRef.current = true;
      return;
    }
    pendingSentRef.current = true;
    void send(pendingMessage);
  }, [pendingMessage, historyLoading, messages.length, turnActive, send, threadId]);

  const showStreamingRow = Boolean(streamingText) || (turnActive && !working);

  // Inverted list: newest first so the visual bottom stays pinned without scrollToEnd races.
  const listData = useMemo(() => {
    const items: ListItem[] = [...messages];
    if (showStreamingRow) {
      items.push({ id: "__streaming__", streaming: true });
    }
    return items.reverse();
  }, [messages, showStreamingRow]);

  // KeyboardAvoidingView (keyboard-controller) lifts the composer on both platforms —
  // edge-to-edge Android no longer resizes the window for the IME.
  const composerPadBottom = Math.max(bottomInset, 8);

  if (!effectiveAgentId) {
    return (
      <RNView style={[styles.centered, { backgroundColor: C.bgLayout }]}>
      <Text style={[styles.placeholder, { color: C.textSecondary }]}>{t("settings.needsAgent")}</Text>
      </RNView>
    );
  }

  if (historyLoading && messages.length === 0 && !pendingMessage) {
    return (
      <RNView style={[styles.centered, { backgroundColor: C.bgLayout }]}>
      <ActivityIndicator size="large" color={C.brand} />
      </RNView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.bgLayout }]}
      behavior="padding"
    >
      <RNView
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0) + 8,
          },
        ]}
      >
      <RNView style={styles.headerSide}>
      <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
      <SymbolView
            name={
              { ios: "chevron.left", android: "arrow-back", web: "arrow_back" } as unknown as Parameters<
                typeof SymbolView
              >[0]["name"]
            }
            tintColor={C.brand}
            size={20}
          />
      </Pressable>
      </RNView>
      <RNView style={styles.headerCenter}>
        {agent ? (
          <AgentTile
            label={tileInitial(agent.name)}
            color={tileColor(agent.color, agent.agent_id)}
            size={32}
            radius={9}
            iconUrl={agent.icon_url}
            iconName={agent.icon_name}
          />
        ) : null}
        <RNView style={styles.headerBody}>
      <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
            {title || agentName || t("newChat.subtitle")}
          </Text>
      <RNView style={styles.statusRow}>
      <RNView
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    (agent?.state ?? "").toLowerCase() === "running" ? C.success : C.textTertiary,
                },
              ]}
            />
      <Text style={[styles.statusText, { color: C.textTertiary }]} numberOfLines={1}>
              {agentName}
            </Text>
      </RNView>
      </RNView>
      </RNView>
      <RNView style={styles.headerSide} />
      </RNView>

      {disconnected ? <ErrorBanner message={t("chat.disconnected")} onRetry={reconnect} /> : null}
      {error ? <ErrorBanner message={error} onRetry={reconnect} /> : null}

      <FlatList
        ref={listRef}
        inverted
        showsVerticalScrollIndicator={false}
        data={listData}
        extraData={{ streamingText, working, turnActive, process }}
        keyExtractor={(item, index) =>
          "streaming" in item ? item.id : `${item.role}-${index}-${item.content.slice(0, 24)}`
        }
        contentContainerStyle={styles.messageList}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        // Inverted: header sits at the visual bottom (above composer); footer at visual top.
        ListHeaderComponent={
          process.items.length > 0 ? (
            <ProcessCard process={process} />
          ) : working && !streamingText ? (
            <WorkingIndicator />
          ) : (
            <RNView style={styles.listBottomSpacer} />
          )
        }
        ListFooterComponent={
          <Text style={[styles.daySeparator, { color: C.textTertiary }]}>{t("chat.today")}</Text>
        }
        renderItem={({ item }) => {
          if ("streaming" in item) {
            return <StreamingBubble content={streamingText} />;
          }
          return <MarkdownBubble role={item.role} content={item.content} />;
        }}
      />
      <RNView
        style={[
          styles.composerShell,
            {
              paddingBottom: composerPadBottom,
            },
          ]}
        >
      <RNView style={styles.composerRow}>
      <PressableScale
            onPress={() => setAttachOpen(true)}
            contentStyle={[
              styles.attachButton,
              { backgroundColor: C.bgElevated, borderColor: C.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("chat.attach")}
          >
      <SymbolView
              name={{ ios: "plus", android: "add", web: "add" } as unknown as Parameters<
                typeof SymbolView
              >[0]["name"]}
              tintColor={C.textTertiary}
              size={18}
            />
      </PressableScale>
      <TextInput
            style={[
              styles.input,
              { borderColor: C.border, backgroundColor: C.bgElevated, color: C.text },
            ]}
            value={draft}
            onChangeText={setDraft}
            testID="chat-composer"
            placeholder={agentName ? t("chat.messageName", { name: agentName }) : t("chat.placeholder")}
            placeholderTextColor={C.textPlaceholder}
            multiline
            editable={!turnActive && !sending}
          />
      <PressableScale
            onPress={turnActive ? stop : handleSend}
            disabled={!turnActive && (!draft.trim() || sending)}
            contentStyle={[
              styles.sendButton,
              { backgroundColor: C.brand },
              !turnActive && (!draft.trim() || sending) && styles.sendDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={turnActive ? t("chat.stop") : t("chat.send")}
          >
            {sending && !turnActive ? (
              <ActivityIndicator size="small" color={C.onBrand} />
            ) : turnActive ? (
              <SymbolView
                name={
                  { ios: "stop.fill", android: "stop", web: "stop" } as unknown as Parameters<
                    typeof SymbolView
                  >[0]["name"]
                }
                tintColor={C.onBrand}
                size={16}
              />
            ) : (
              <SymbolView
                name={
                  {
                    ios: "arrow.up",
                    android: "arrow_upward",
                    web: "arrow_upward",
                  } as unknown as Parameters<typeof SymbolView>[0]["name"]
                }
                tintColor={C.onBrand}
                size={18}
              />
            )}
          </PressableScale>
      </RNView>
      </RNView>
      <ActionSheet
        visible={attachOpen}
        onDismiss={() => setAttachOpen(false)}
        actions={[
          {
            key: "kb",
            label: t("chat.attachKb"),
            icon: { ios: "book", android: "menu_book", web: "menu_book" },
            onPress: openConsole,
          },
        ]}
      />
      </KeyboardAvoidingView>
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
  placeholder: {
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  // Equal side slots optically center the title group (design 15).
  headerSide: {
    width: 28,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerBody: {
    flexShrink: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexGrow: 1,
    gap: 10,
  },
  listBottomSpacer: {
    height: 4,
  },
  daySeparator: {
    fontSize: 11,
    fontWeight: "500",
    alignSelf: "center",
    // Inverted list: footer renders at the visual top.
    marginVertical: 8,
  },
  composerShell: {
    paddingHorizontal: 0,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 12px rgba(232, 93, 117, 0.28)",
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
