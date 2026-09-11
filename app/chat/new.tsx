import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
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
import { AgentTile } from "@/src/components/AgentTile";
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
  const { api } = useAuth();
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === "android") {
        return;
      }
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

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

  const composerPadBottom = keyboardHeight > 0 ? keyboardHeight + 8 : Math.max(bottomInset, 8);

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <RNView
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0) + 8,
            backgroundColor: C.bgElevated,
            borderBottomColor: C.border,
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
          <Text style={[styles.headerName, { color: C.text }]} numberOfLines={1}>
            {agentName}
          </Text>
          <Text style={[styles.headerSub, { color: C.textTertiary }]} numberOfLines={1}>
            {t("newChat.subtitle")}
          </Text>
        </RNView>
      </RNView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {error ? <ErrorBanner message={error} /> : null}

        {agentName ? (
          <RNView
            style={[
              styles.welcome,
              { backgroundColor: C.assistantBubble, borderColor: C.assistantBorder },
            ]}
          >
            <Text style={[styles.welcomeText, { color: C.text }]}>
              {t("newChat.welcome", { name: agentName })}
            </Text>
          </RNView>
        ) : null}

        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>
          {t("newChat.tryAsking")}
        </Text>
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
            <RNView style={[styles.promptIcon, { backgroundColor: C.brandSoft }]}>
              <SymbolView
                name={qp.icon as unknown as Parameters<typeof SymbolView>[0]["name"]}
                tintColor={C.brand}
                size={20}
              />
            </RNView>
            <RNView style={styles.promptBody}>
              <Text style={[styles.promptTitle, { color: C.text }]}>{qp.title}</Text>
              <Text style={[styles.promptDesc, { color: C.textSecondary }]} numberOfLines={2}>
                {qp.desc}
              </Text>
            </RNView>
            <SymbolView
              name={
                {
                  ios: "chevron.right",
                  android: "chevron_right",
                  web: "chevron_right",
                } as unknown as Parameters<typeof SymbolView>[0]["name"]
              }
              tintColor={C.textTertiary}
              size={16}
            />
          </Pressable>
        ))}
      </ScrollView>

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
            placeholder={
              agentName ? t("chat.messageName", { name: agentName }) : t("chat.placeholder")
            }
            placeholderTextColor={C.textPlaceholder}
            multiline
            editable={!creating}
          />
          <Pressable
            onPress={() => void handleSend()}
            disabled={!draft.trim() || creating}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: C.brand },
              pressed && styles.pressed,
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
        </RNView>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
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
  headerName: {
    fontSize: 16,
    fontWeight: "700",
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
    borderRadius: 18,
    borderCurve: "continuous",
    borderTopLeftRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignSelf: "flex-start",
    maxWidth: "92%",
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  promptBody: {
    flex: 1,
    gap: 2,
  },
  promptTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  promptDesc: {
    fontSize: 13,
    lineHeight: 18,
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
});
