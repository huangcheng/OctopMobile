import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
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
import { AgentTile } from "@/src/components/AgentTile";
import { ActionSheet } from "@/src/components/ActionSheet";
import { PressableScale } from "@/src/components/PressableScale";
import { createThread } from "@/src/api/threads";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor, tileInitial } from "@/src/utils/color";

/** New chat (designs 17–18): hero, welcome bubble, TRY ASKING prompts, composer. */
export default function NewChatScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  const { api, baseUrl } = useAuth();
  const { agents, selectedAgentId, selectAgent } = useSelectedAgent();
  const { agentId: agentIdParam, name, prefill } = useLocalSearchParams<{
    agentId?: string;
    name?: string;
    prefill?: string;
  }>();

  const effectiveAgentId = agentIdParam ?? selectedAgentId;
  const agent = agents.find((a) => a.agent_id === effectiveAgentId);
  const agentName = name ?? agent?.name ?? "";

  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);

  function openConsole() {
    router.push({
      pathname: "/console",
      params: { path: "/knowledge-bases", title: t("chat.attachKb") },
    });
  }

  useEffect(() => {
    if (prefill) {
      setDraft(prefill);
    }
  }, [prefill]);

  useEffect(() => {
    if (effectiveAgentId && selectedAgentId !== effectiveAgentId) {
      void selectAgent(effectiveAgentId);
    }
  }, [effectiveAgentId, selectedAgentId, selectAgent]);

  async function handleSend(text?: string) {
    const message = (text ?? draft).trim();
    if (!message || creating || !effectiveAgentId) {
      return;
    }

    setCreating(true);
    setError(null);
    Keyboard.dismiss();
    try {
      const { thread_id } = await createThread(api, effectiveAgentId);
      router.replace({
        pathname: "/chat/[threadId]",
        params: {
          threadId: thread_id,
          agentId: effectiveAgentId,
          name: agentName,
          pendingMessage: message,
        },
      });
    } catch {
      setError(t("errors.network"));
      setCreating(false);
    }
  }

  const composerPadBottom = Math.max(bottomInset, 8);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.bgLayout }]}
      behavior="padding"
    >      <RNView
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
          <Text style={[styles.headerName, { color: C.text }]} numberOfLines={1}>
            {agentName}
          </Text>
          <Text style={[styles.headerSub, { color: C.textTertiary }]} numberOfLines={1}>
            {t("newChat.subtitle")}
          </Text>
        </RNView>
        </RNView>
        <RNView style={styles.headerSide} />
      </RNView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {error ? <ErrorBanner message={error} /> : null}

        {agentName ? (
          <RNView
            style={[
              styles.welcome,
              {
                backgroundColor: C.bgElevated,
                borderColor: C.border,
                boxShadow: `0px 1px 3px ${C.cardShadow}`,
              },
            ]}
          >
            <Text style={[styles.welcomeText, { color: C.text }]}>
              {t("newChat.welcome", { name: agentName })}
            </Text>
          </RNView>
        ) : null}

        {(
          [
            {
              key: "1",
              title: t("expert.quickPrompt1Title"),
              desc: t("expert.quickPrompt1Desc"),
              prompt: t("expert.quickPrompt1"),
              icon: { ios: "text.badge.checkmark", android: "fact_check", web: "fact_check" },
            },
            {
              key: "2",
              title: t("expert.quickPrompt2Title"),
              desc: t("expert.quickPrompt2Desc"),
              prompt: t("expert.quickPrompt2"),
              icon: { ios: "list.bullet.rectangle", android: "checklist", web: "checklist" },
            },
          ] as const
        ).map((qp) => (
          <Pressable
            key={qp.key}
            onPress={() => void handleSend(qp.prompt)}
            disabled={creating}
            style={({ pressed }) => [
              styles.promptCard,
              {
                backgroundColor: C.bgElevated,
                borderColor: C.border,
                boxShadow: `0px 1px 3px ${C.cardShadow}`,
              },
              pressed && { backgroundColor: C.bgTertiary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={qp.title}
          >
            <RNView
              style={[
                styles.promptIcon,
                { backgroundColor: `${tileColor(null, `prompt-${qp.key}`)}1F` },
              ]}
            >
              <SymbolView
                name={qp.icon as unknown as Parameters<typeof SymbolView>[0]["name"]}
                tintColor={tileColor(null, `prompt-${qp.key}`)}
                size={20}
              />
            </RNView>
            <RNView style={styles.promptBody}>
              <Text style={[styles.promptTitle, { color: C.text }]}>{qp.title}</Text>
              <Text style={[styles.promptDesc, { color: C.textSecondary }]} numberOfLines={2}>
                {qp.desc}
              </Text>
            </RNView>
          </Pressable>
        ))}
      </ScrollView>

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
            placeholder={
              agentName ? t("chat.messageName", { name: agentName }) : t("chat.placeholder")
            }
            placeholderTextColor={C.textPlaceholder}
            multiline
            editable={!creating}
          />
          <PressableScale
            onPress={() => void handleSend()}
            disabled={!draft.trim() || creating}
            contentStyle={[
              styles.sendButton,
              { backgroundColor: C.brand },
              (!draft.trim() || creating) && styles.sendDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("chat.send")}
          >
            {creating ? (
              <ActivityIndicator size="small" color={C.onBrand} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  // Equal side slots optically center the title group (design 17).
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
  headerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSub: {
    fontSize: 12,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10,
  },
  welcome: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: "flex-start",
    maxWidth: "92%",
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
  },
  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 14,
  },
  promptIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  promptBody: {
    flex: 1,
    gap: 2,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  promptDesc: {
    fontSize: 13,
    lineHeight: 18,
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
