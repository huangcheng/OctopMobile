import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { AgentTile } from "@/src/components/AgentTile";
import { StatusPill } from "@/src/components/StatusPill";
import { listThreads } from "@/src/api/threads";
import { startAgent, stopAgent } from "@/src/api/agents";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor, tileInitial } from "@/src/utils/color";

const MBTI_RE = /\b([IE])([SN])([TF])([JP])\b/i;

/** Expert detail (design 10): hero, ABOUT, TRY ASKING, stop/start agent, Start chat bar. */
export default function ExpertDetailScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { api } = useAuth();
  const { agents, refresh } = useSelectedAgent();
  const { agentId } = useLocalSearchParams<{ agentId: string }>();

  const [threadCount, setThreadCount] = useState<number | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agent = agents.find((a) => a.agent_id === agentId);
  const running = (agent?.state ?? "").toLowerCase() === "running";
  const mbti = agent?.name.toUpperCase().match(MBTI_RE)?.[0] ?? null;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!agentId) {
        return;
      }
      void (async () => {
        try {
          const threads = await listThreads(api, agentId);
          if (!cancelled) {
            setThreadCount(threads.length);
          }
        } catch {
          // Count is decorative; ignore failures.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [agentId, api]),
  );

  async function toggleAgent() {
    if (!agentId || actionBusy) {
      return;
    }
    setActionBusy(true);
    setError(null);
    try {
      if (running) {
        await stopAgent(api, agentId);
      } else {
        await startAgent(api, agentId);
      }
      await refresh();
    } catch {
      setError(t("errors.actionFailed"));
    } finally {
      setActionBusy(false);
    }
  }

  function startChat(prefill?: string) {
    if (!agent) {
      return;
    }
    router.push({
      pathname: "/chat/new",
      params: { agentId: agent.agent_id, name: agent.name, prefill: prefill ?? "" },
    });
  }

  if (!agent) {
    return (
      <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
        <RNView style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow-back", web: "arrow_back" } as unknown as Parameters<typeof SymbolView>[0]["name"]}
              tintColor={C.text}
              size={22}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: C.text }]}>{t("expert.title")}</Text>
        </RNView>
        <ErrorBanner message={t("errors.actionFailed")} onRetry={() => router.back()} />
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <RNView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow-back", web: "arrow_back" } as unknown as Parameters<typeof SymbolView>[0]["name"]}
            tintColor={C.text}
            size={22}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>{t("expert.title")}</Text>
      </RNView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? <ErrorBanner message={error} /> : null}

        <RNView
          style={[
            styles.heroCard,
            { backgroundColor: C.bgElevated, borderColor: C.border, boxShadow: `0px 1px 3px ${C.cardShadow}` },
          ]}
        >
          <RNView style={styles.heroTop}>
            <AgentTile
              label={tileInitial(agent.name)}
              color={tileColor(agent.color, agent.agent_id)}
              size={56}
              radius={14}
              iconUrl={agent.icon_url}
              iconName={agent.icon_name}
            />
            <RNView style={styles.heroBody}>
              <Text style={[styles.heroName, { color: C.text }]} numberOfLines={1}>
                {agent.name}
              </Text>
              <RNView style={styles.chipRow}>
                {mbti ? (
                  <RNView style={[styles.mbtiChip, { backgroundColor: C.bgTertiary }]}>
                    <Text style={[styles.mbtiText, { color: C.textSecondary }]}>{mbti}</Text>
                  </RNView>
                ) : null}
                <StatusPill
                  kind={running ? "running" : "stopped"}
                  label={running ? t("experts.running") : t("experts.stopped")}
                />
              </RNView>
              {threadCount !== null ? (
                <Text style={[styles.heroMeta, { color: C.textTertiary }]}>
                  {t("experts.conversations", { count: threadCount })}
                </Text>
              ) : null}
            </RNView>
          </RNView>
        </RNView>

        {agent.description ? (
          <>
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>
              {t("expert.about")}
            </Text>
            <RNView
              style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border }]}
            >
              <Text style={[styles.aboutText, { color: C.textSecondary }]}>
                {agent.description}
              </Text>
            </RNView>
          </>
        ) : null}

        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>
          {t("expert.tryAsking")}
        </Text>
        {(
          [
            { key: "1", title: t("expert.quickPrompt1Title"), prompt: t("expert.quickPrompt1") },
            { key: "2", title: t("expert.quickPrompt2Title"), prompt: t("expert.quickPrompt2") },
          ] as const
        ).map((qp) => (
          <Pressable
            key={qp.key}
            onPress={() => startChat(qp.prompt)}
            style={({ pressed }) => [
              styles.card,
              styles.promptCard,
              { backgroundColor: C.bgElevated, borderColor: C.border },
              pressed && { backgroundColor: C.bgTertiary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={qp.prompt}
          >
            <Text style={[styles.promptTitle, { color: C.text }]}>{qp.title}</Text>
            <Text style={[styles.promptQuote, { color: C.textSecondary }]}>"{qp.prompt}"</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={toggleAgent}
          disabled={actionBusy}
          style={({ pressed }) => [
            styles.stopButton,
            { borderColor: running ? C.danger : C.success },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={running ? t("expert.stopAgent") : t("expert.startAgent")}
        >
          {actionBusy ? (
            <ActivityIndicator color={running ? C.danger : C.success} />
          ) : (
            <Text style={[styles.stopText, { color: running ? C.danger : C.success }]}>
              {running ? t("expert.stopAgent") : t("expert.startAgent")}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <RNView
        style={[
          styles.bottomBar,
          { backgroundColor: C.bgElevated, borderTopColor: C.border, paddingBottom: insets.bottom + 10 },
        ]}
      >
        <RNView style={[styles.composerFake, { borderColor: C.border, backgroundColor: C.bgSecondary }]}>
          <Text style={[styles.composerFakeText, { color: C.textPlaceholder }]} numberOfLines={1}>
            {t("chat.messageName", { name: agent.name })}
          </Text>
        </RNView>
        <Pressable
          onPress={() => startChat()}
          style={({ pressed }) => [
            styles.startChatButton,
            { backgroundColor: C.brand },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("expert.startChat")}
        >
          <Text style={[styles.startChatText, { color: C.onBrand }]}>{t("expert.startChat")}</Text>
        </Pressable>
      </RNView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  heroCard: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 16,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroBody: {
    flex: 1,
    gap: 5,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mbtiChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  mbtiText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heroMeta: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 16,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 21,
  },
  promptCard: {
    gap: 6,
  },
  promptTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  promptQuote: {
    fontSize: 13,
    lineHeight: 19,
  },
  stopButton: {
    marginTop: 8,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1.5,
    alignItems: "center",
    paddingVertical: 13,
  },
  stopText: {
    fontSize: 15,
    fontWeight: "700",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  composerFake: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  composerFakeText: {
    fontSize: 14,
  },
  startChatButton: {
    borderRadius: 22,
    paddingHorizontal: 20,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  startChatText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
