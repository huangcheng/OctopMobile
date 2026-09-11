import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
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
import { useToast } from "@/src/components/Toast";
import { listThreads } from "@/src/api/threads";
import { startAgent, stopAgent } from "@/src/api/agents";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor, tileInitial } from "@/src/utils/color";

const MBTI_RE = /\b([IE])([SN])([TF])([JP])\b/i;

type SFSymbol = Parameters<typeof SymbolView>[0]["name"];

/** Expert detail (design 10): centered hero, ABOUT, TRY ASKING, stop link, Share + Start chat CTA. */
export default function ExpertDetailScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { api } = useAuth();
  const { agents, refresh } = useSelectedAgent();
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const toast = useToast();

  const [threadCount, setThreadCount] = useState<number | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agent = agents.find((a) => a.agent_id === agentId);
  const running = (agent?.state ?? "").toLowerCase() === "running";
  const mbti = agent?.name.toUpperCase().match(MBTI_RE)?.[0] ?? null;
  const agentColor = agent ? tileColor(agent.color, agent.agent_id) : C.brand;

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
      toast.show({
        kind: "success",
        message: running ? t("feedback.agentStopped") : t("feedback.agentStarted"),
      });
    } catch {
      toast.show({ kind: "error", message: t("errors.actionFailed") });
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

  function shareExpert() {
    if (!agent) {
      return;
    }
    const blurb = agent.description ? `\n${agent.description}` : "";
    void Share.share({ message: `${agent.name} — Octop${blurb}` });
  }

  const navHeader = (
    <RNView style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityLabel="Back"
        accessibilityRole="button"
      >
        <SymbolView
          name={{ ios: "chevron.left", android: "arrow-back", web: "arrow_back" } as unknown as SFSymbol}
          tintColor={C.brand}
          size={20}
        />
      </Pressable>
      <Text style={[styles.headerTitle, { color: C.text }]}>{t("expert.title")}</Text>
    </RNView>
  );

  if (!agent) {
    return (
      <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
        {navHeader}
        <ErrorBanner message={t("errors.actionFailed")} onRetry={() => router.back()} />
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      {navHeader}

      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? <ErrorBanner message={error} /> : null}

        <RNView style={styles.hero}>
          <AgentTile
            label={tileInitial(agent.name)}
            color={agentColor}
            size={88}
            radius={24}
            iconUrl={agent.icon_url}
            iconName={agent.icon_name}
            glow
          />
          <Text style={[styles.heroName, { color: C.text }]} numberOfLines={1}>
            {agent.name}
          </Text>
          <RNView style={styles.heroMeta}>
            {mbti ? (
              <RNView style={[styles.mbtiChip, { backgroundColor: C.brandSoft }]}>
                <Text style={[styles.mbtiText, { color: C.brand }]}>{mbti}</Text>
              </RNView>
            ) : null}
            <StatusPill
              kind={running ? "running" : "stopped"}
              label={running ? t("experts.running") : t("experts.stopped")}
            />
            {threadCount !== null ? (
              <Text style={[styles.heroCount, { color: C.textTertiary }]}>
                {t("experts.conversations", { count: threadCount })}
              </Text>
            ) : null}
          </RNView>
        </RNView>

        {agent.description ? (
          <>
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>
              {t("expert.about")}
            </Text>
            <RNView
              style={[
                styles.card,
                {
                  backgroundColor: C.bgElevated,
                  borderColor: C.border,
                  boxShadow: `0px 1px 3px ${C.cardShadow}`,
                },
              ]}
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
            { key: "1", prompt: t("expert.quickPrompt1") },
            { key: "2", prompt: t("expert.quickPrompt2") },
          ] as const
        ).map((qp) => (
          <Pressable
            key={qp.key}
            onPress={() => startChat(qp.prompt)}
            style={({ pressed }) => [
              styles.card,
              styles.promptCard,
              {
                backgroundColor: C.bgElevated,
                borderColor: C.border,
                boxShadow: `0px 1px 3px ${C.cardShadow}`,
              },
              pressed && { backgroundColor: C.bgTertiary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={qp.prompt}
          >
            <Text style={[styles.promptQuote, { color: C.textSecondary }]}>"{qp.prompt}"</Text>
            <SymbolView
              name={{ ios: "arrow.up.right", android: "north_east", web: "north_east" } as unknown as SFSymbol}
              tintColor={C.textTertiary}
              size={16}
            />
          </Pressable>
        ))}

        <Pressable
          onPress={toggleAgent}
          disabled={actionBusy}
          style={({ pressed }) => [styles.stopLink, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={running ? t("expert.stopAgent") : t("expert.startAgent")}
        >
          {actionBusy ? (
            <ActivityIndicator color={running ? C.danger : C.success} size="small" />
          ) : (
            <Text style={[styles.stopText, { color: running ? C.danger : C.success }]}>
              {running ? t("expert.stopAgent") : t("expert.startAgent")}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <RNView
        style={[
          styles.ctaBar,
          {
            backgroundColor: C.bgElevated,
            borderTopColor: C.border,
            paddingBottom: Math.max(28, insets.bottom + 10),
          },
        ]}
      >
        <Pressable
          onPress={shareExpert}
          style={({ pressed }) => [
            styles.shareButton,
            { backgroundColor: C.bgElevated, borderColor: C.border },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("expert.share")}
        >
          <SymbolView
            name={{ ios: "square.and.arrow.up", android: "share", web: "share" } as unknown as SFSymbol}
            tintColor={C.text}
            size={20}
          />
        </Pressable>
        <Pressable
          onPress={() => startChat()}
          style={({ pressed }) => [
            styles.startChatButton,
            { backgroundColor: C.brand, boxShadow: `0px 4px 12px ${C.brandShadow}` },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("expert.startChat")}
        >
          <SymbolView
            name={{ ios: "message", android: "chat_bubble_outline", web: "chat_bubble_outline" } as unknown as SFSymbol}
            tintColor={C.onBrand}
            size={18}
          />
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
    paddingHorizontal: 12,
    paddingRight: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "600",
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mbtiChip: {
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  mbtiText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  heroCount: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 14,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 21,
  },
  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  promptQuote: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  stopLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  stopText: {
    fontSize: 13,
    fontWeight: "600",
  },
  ctaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startChatButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  startChatText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
