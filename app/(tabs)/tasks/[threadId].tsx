import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View as RNView,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { MarkdownBubble } from "@/src/components/MarkdownBubble";
import { WorkingIndicator } from "@/src/components/WorkingIndicator";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useChatTurn, type ChatDisplayMessage } from "@/src/features/chat/useChatTurn";
import { t } from "@/src/i18n";

export default function ThreadChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { selectedAgentId } = useSelectedAgent();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatDisplayMessage | { id: string; streaming: true }>>(null);

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
  } = useChatTurn({
    agentId: selectedAgentId,
    threadId: threadId ?? "",
  });

  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, streamingText, working, scrollToEnd]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending || turnActive) {
      return;
    }

    setSending(true);
    setDraft("");

    try {
      await send(text);
    } finally {
      setSending(false);
    }
  }

  const listData: Array<ChatDisplayMessage | { id: string; streaming: true }> = [...messages];
  if (streamingText) {
    listData.push({ id: "__streaming__", streaming: true });
  }

  if (!selectedAgentId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.placeholder}>{t("tasks.noAgent")}</Text>
      </View>
    );
  }

  if (historyLoading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {disconnected ? (
        <ErrorBanner message={t("chat.disconnected")} onRetry={reconnect} />
      ) : null}
      {error ? <ErrorBanner message={error} onRetry={reconnect} /> : null}

      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item, index) =>
          "streaming" in item ? item.id : `${item.role}-${index}-${item.content.slice(0, 24)}`
        }
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToEnd}
        renderItem={({ item }) => {
          if ("streaming" in item) {
            return <MarkdownBubble role="assistant" content={streamingText} />;
          }
          return <MarkdownBubble role={item.role} content={item.content} />;
        }}
        ListFooterComponent={working ? <WorkingIndicator /> : null}
      />

      <RNView style={styles.composerRow}>
        {turnActive ? (
          <Pressable
            onPress={stop}
            style={({ pressed }) => [styles.stopButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("chat.stop")}
          >
            <Text style={styles.stopText}>{t("chat.stop")}</Text>
          </Pressable>
        ) : null}

        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t("tasks.chatTitle")}
          multiline
          editable={!turnActive && !sending}
        />

        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || sending || turnActive}
          style={({ pressed }) => [
            styles.sendButton,
            pressed && styles.buttonPressed,
            (!draft.trim() || sending || turnActive) && styles.sendDisabled,
          ]}
          accessibilityRole="button"
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </Pressable>
      </RNView>
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
    opacity: 0.7,
    textAlign: "center",
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexGrow: 1,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#2f95dc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  stopButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#b00020",
  },
  stopText: {
    color: "#b00020",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
