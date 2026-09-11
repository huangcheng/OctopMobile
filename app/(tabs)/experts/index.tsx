import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View as RNView } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { HeaderGear } from "@/src/components/HeaderGear";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { SearchField } from "@/src/components/SearchField";
import { AgentTile } from "@/src/components/AgentTile";
import { StatusPill } from "@/src/components/StatusPill";
import type { Agent } from "@/src/api/types";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor, tileInitial } from "@/src/utils/color";

const MBTI_RE = /\b([IE])([SN])([TF])([JP])\b/i;

function agentMbti(agent: Agent): string | null {
  const fromName = agent.name?.toUpperCase().match(MBTI_RE)?.[0];
  if (fromName) {
    return fromName;
  }
  return agent.description?.toUpperCase().match(MBTI_RE)?.[0] ?? null;
}

function isRunning(agent: Agent): boolean {
  return (agent.state ?? "").toLowerCase() === "running";
}

/** Experts list (design 08): search, MY EXPERTS cards with MBTI tags + status, market row. */
export default function ExpertsScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const { baseUrl } = useAuth();
  const { agents, loading, error, refresh } = useSelectedAgent();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return agents;
    }
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        (agent.description ?? "").toLowerCase().includes(q),
    );
  }, [agents, query]);

  function openConsole() {
    if (baseUrl) {
      void WebBrowser.openBrowserAsync(baseUrl);
    }
  }

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <ScreenHeader title={t("experts.title")} action={<HeaderGear />} />

      <RNView style={styles.searchWrap}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t("experts.searchPlaceholder")}
        />
      </RNView>

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {agents.length > 0 ? (
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>
          {t("experts.mine")}
        </Text>
      ) : null}

      {loading && agents.length === 0 ? (
        <RNView style={styles.listWrap}>
          <RNView style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border, opacity: 0.7 }]}>
            <RNView style={styles.cardRow}>
              <RNView style={[styles.skeletonTile, { backgroundColor: C.bgTertiary }]} />
              <RNView style={styles.skeletonLines}>
                <RNView style={[styles.skeletonTitle, { backgroundColor: C.bgTertiary }]} />
                <RNView style={[styles.skeletonDesc, { backgroundColor: C.bgTertiary }]} />
              </RNView>
            </RNView>
          </RNView>
        </RNView>
      ) : null}

      {!loading && agents.length === 0 && !error ? (
        <EmptyState
          title={t("experts.emptyTitle")}
          subtitle={t("experts.emptySubtitle")}
          ctaLabel={t("experts.emptyCta")}
          onCta={openConsole}
        />
      ) : null}

      {filtered.length > 0 || agents.length > 0 ? (
        <FlatList<Agent>
          showsVerticalScrollIndicator={false}
          data={filtered}
          keyExtractor={(item) => item.agent_id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.brand} />
          }
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <Pressable
              onPress={openConsole}
              style={({ pressed }) => [
                styles.marketRow,
                {
                  backgroundColor: C.bgElevated,
                  borderColor: C.border,
                  boxShadow: `0px 1px 3px ${C.cardShadow}`,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("experts.market")}
            >
              <Text style={[styles.marketText, { color: C.brand }]}>{t("experts.market")}</Text>
            </Pressable>
          }
          renderItem={({ item }) => {
            const mbti = agentMbti(item);

            return (
              <Pressable
                onPress={() => router.push(`/expert/${item.agent_id}`)}
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
                accessibilityLabel={item.name}
              >
                <AgentTile
                  label={tileInitial(item.name)}
                  color={tileColor(item.color, item.agent_id)}
                  iconUrl={item.icon_url}
                  iconName={item.icon_name}
                />
                <RNView style={styles.cardBody}>
                  <RNView style={styles.nameRow}>
                    <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {mbti ? (
                      <RNView style={[styles.mbtiChip, { backgroundColor: C.brandSoft }]}>
                        <Text style={[styles.mbtiText, { color: C.brand }]}>{mbti}</Text>
                      </RNView>
                    ) : null}
                  </RNView>
                  {item.description ? (
                    <Text style={[styles.desc, { color: C.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </RNView>
                <StatusPill
                  kind={isRunning(item) ? "running" : "stopped"}
                  label={isRunning(item) ? t("experts.running") : t("experts.stopped")}
                />
              </Pressable>
            );
          }}
        />
      ) : null}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listWrap: {
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    gap: 12,
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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
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
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  marketRow: {
    height: 44,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  marketText: {
    fontSize: 13,
    fontWeight: "600",
  },
  skeletonTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    width: "45%",
    height: 14,
    borderRadius: 7,
  },
  skeletonDesc: {
    width: "70%",
    height: 11,
    borderRadius: 6,
  },
});
