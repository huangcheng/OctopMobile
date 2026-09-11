import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { MarkdownBubble } from "@/src/components/MarkdownBubble";
import { StreamingBubble } from "@/src/components/StreamingBubble";
import { WorkingIndicator } from "@/src/components/WorkingIndicator";
import { ProcessCard } from "@/src/components/ProcessCard";
import { AgentTile } from "@/src/components/AgentTile";
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

  const effectiveAgentId = agentIdParam ?? selectedAgentId;
  const agent = agents.find((a) => a.agent_id === effectiveAgentId);
  const agentName = name ?? agent?.name ?? "";

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const pendingSentRef = useRef(false);
  const listRef = useRef<FlatList<ListItem>>(null);

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
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (e) => {
      // Android typically resizes the window; only lift the composer on iOS.
      if (Platform.OS === "android") {
        return;
      }
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

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

  // Keyboard open: pad by keyboard height (screen-bottom). Closed: home indicator only.
  // Avoid KeyboardAvoidingView — it stacked with safe-area and left a huge bottom gap.
  const composerPadBottom = keyboardHeight > 0 ? keyboardHeight + 8 : Math.max(bottomInset, 8);

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
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <RNView
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0) + 8,
            borderBottomColor: C.border,
            backgroundColor: C.bgElevated,
          },
        ]}
      >
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
            tintColor={C.text}
            size={22}
          />
        </Pressable>
        {agent ? (
          <AgentTile
            label={tileInitial(agent.name)}
            color={tileColor(agent.color, agent.agent_id)}
            size={30}
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

      {disconnected ? <ErrorBanner message={t("chat.disconnected")} onRetry={reconnect} /> : null}
      {error ? <ErrorBanner message={error} onRetry={reconnect} /> : null}

      <FlatList
        ref={listRef}
        inverted
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
              backgroundColor: C.bgElevated,
              borderTopColor: C.border,
              paddingBottom: composerPadBottom,
            },
          ]}
        >
        <RNView style={styles.composerRow}>
          <TextInput
            style={[
              styles.input,
              { borderColor: C.border, backgroundColor: C.bgSecondary, color: C.text },
            ]}
            value={draft}
            onChangeText={setDraft}
            placeholder={agentName ? t("chat.messageName", { name: agentName }) : t("chat.placeholder")}
            placeholderTextColor={C.textPlaceholder}
            multiline
            editable={!turnActive && !sending}
          />

          {turnActive ? (
            <Pressable
              onPress={stop}
              style={({ pressed }) => [
                styles.stopButton,
                { borderColor: C.danger, backgroundColor: C.dangerBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("chat.stop")}
            >
              <SymbolView
                name={
                  { ios: "stop.fill", android: "stop", web: "stop" } as unknown as Parameters<
                    typeof SymbolView
                  >[0]["name"]
                }
                tintColor={C.danger}
                size={18}
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim() || sending}
              style={({ pressed }) => [
                styles.sendButton,
                { backgroundColor: C.brand },
                pressed && styles.pressed,
                (!draft.trim() || sending) && styles.sendDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("chat.send")}
            >
              {sending ? (
                <ActivityIndicator size="small" color={C.onBrand} />
              ) : (
                <SymbolView
                  name={
                    {
                      ios: "arrow.up.circle.fill",
                      android: "send",
                      web: "send",
                    } as unknown as Parameters<typeof SymbolView>[0]["name"]
                  }
                  tintColor={C.onBrand}
                  size={26}
                />
              )}
            </Pressable>
          )}
        </RNView>
      </RNView>
    </RNView>
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
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBody: {
    flex: 1,
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
    width: 7,
    height: 7,
    borderRadius: 4,
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
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    alignSelf: "center",
    // Inverted list: footer renders at the visual top.
    marginVertical: 8,
  },
  composerShell: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 3px 8px rgba(232, 93, 117, 0.28)",
  },
  sendDisabled: {
    opacity: 0.45,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
