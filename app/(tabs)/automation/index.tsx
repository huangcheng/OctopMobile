import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View as RNView } from "react-native";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { Fab } from "@/src/components/Fab";
import { HeaderGear } from "@/src/components/HeaderGear";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { SkeletonList } from "@/src/components/SkeletonList";
import { StatusPill } from "@/src/components/StatusPill";
import { Toggle } from "@/src/components/Toggle";
import { useToast } from "@/src/components/Toast";
import { getCronSettings, listCronJobs, setCronEnabled } from "@/src/api/cron";
import type { CronJob } from "@/src/api/types";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cronStatusLabel, formatTrigger } from "@/src/utils/schedule";

type JobRow = CronJob & { agentName: string };

/** Automation (design 13): SCHEDULED JOBS cards with toggle + OK/Error, server timezone footer. */
export default function AutomationScreen() {
  const C = useOctopTheme();
  const { t, locale } = useI18n();
  const { api, baseUrl } = useAuth();
  const { agents, loading: agentsLoading } = useSelectedAgent();
  const toast = useToast();

  const [rows, setRows] = useState<JobRow[]>([]);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const owned = agents.filter((a) => a.is_owner !== false);
      const jobs = await Promise.all(
        owned.map(async (agent): Promise<JobRow[]> => {
          try {
            const list = await listCronJobs(api, agent.agent_id);
            return list.map((job) => ({
              ...job,
              agentName: (job.agent_name as string | undefined) || agent.name,
            }));
          } catch {
            return [];
          }
        }),
      );
      const merged = jobs
        .flat()
        .sort((a, b) => (a.created_at ?? "") < (b.created_at ?? "") ? 1 : -1);
      setRows(merged);

      try {
        const settings = await getCronSettings(api);
        setTimezone(settings.timezone);
      } catch {
        setTimezone(null);
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }, [agents, api, t]);

  const [pulling, setPulling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (agents.length > 0) {
        void refresh();
      }
    }, [refresh, agents.length]),
  );

  async function handlePull() {
    setPulling(true);
    await refresh();
    setPulling(false);
  }

  async function toggleJob(row: JobRow, next: boolean) {
    if (busyId) {
      return;
    }
    setBusyId(row.cron_id);
    try {
      await setCronEnabled(api, row.agent_id, row.cron_id, next);
      setRows((prev) =>
        prev.map((r) => (r.cron_id === row.cron_id ? { ...r, enabled: next } : r)),
      );
      toast.show({
        kind: "success",
        message: next ? t("feedback.jobEnabled") : t("feedback.jobDisabled"),
      });
    } catch {
      toast.show({ kind: "error", message: t("errors.actionFailed") });
    } finally {
      setBusyId(null);
    }
  }

  function openConsole() {
    router.push({
      pathname: "/console",
      params: { path: "/tasks", title: t("automation.title") },
    });
  }

  const hasAgents = agents.length > 0;
  const status = (row: JobRow) => cronStatusLabel(row.last_status);

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <ScreenHeader title={t("automation.title")} action={<HeaderGear />} />

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {(loading || agentsLoading) && rows.length === 0 ? (
        <RNView style={styles.skeletonWrap}>
          <SkeletonList rows={3} />
        </RNView>
      ) : null}

      {!loading && !hasAgents && !error ? (
        <EmptyState
          title={t("automation.emptyTitle")}
          subtitle={t("automation.emptySubtitle")}
          ctaLabel={t("automation.emptyCta")}
          onCta={openConsole}
        />
      ) : null}

      {hasAgents && !loading && rows.length === 0 && !error ? (
        <EmptyState
          title={t("automation.emptyTitle")}
          subtitle={t("automation.emptySubtitle")}
          ctaLabel={t("automation.emptyCta")}
          onCta={openConsole}
        />
      ) : null}

      {rows.length > 0 ? (
        <FlatList<JobRow>
          style={styles.listFlex}
          showsVerticalScrollIndicator={false}
          data={rows}
          keyExtractor={(item) => item.cron_id}
          refreshControl={
            <RefreshControl refreshing={pulling} onRefresh={handlePull} tintColor={C.brand} />
          }
          contentContainerStyle={styles.list}
          // Avoid contentContainerStyle `gap` — FlatList remount/focus can stack rows.
          ItemSeparatorComponent={() => <RNView style={styles.separator} />}
          ListHeaderComponent={
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>
              {t("automation.jobs")}
            </Text>
          }
          renderItem={({ item }) => {
            const enabled = item.enabled === true || item.enabled === 1;
            const schedule = formatTrigger(item.trigger, locale);
            const jobStatus = status(item);

            return (
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
                <RNView style={styles.cardTop}>
                  <Text style={[styles.jobName, { color: C.text }]} numberOfLines={1}>
                    {item.prompt.split("\n")[0].slice(0, 60) || item.cron_id}
                  </Text>
                  <Toggle
                    value={enabled}
                    onChange={(next) => void toggleJob(item, next)}
                    disabled={busyId === item.cron_id}
                    accessibilityLabel={item.prompt.slice(0, 30)}
                  />
                </RNView>
                <RNView style={styles.metaRow}>
                  <RNView
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          jobStatus === "ok"
                            ? C.success
                            : jobStatus === "error"
                              ? C.danger
                              : C.textTertiary,
                      },
                    ]}
                  />
                  <Text style={[styles.metaText, { color: C.textTertiary }]} numberOfLines={1}>
                    {`${item.agentName} · ${schedule}`}
                  </Text>
                  {jobStatus !== "pending" ? (
                    <StatusPill
                      kind={jobStatus}
                      label={jobStatus === "ok" ? t("automation.ok") : t("automation.error")}
                    />
                  ) : null}
                </RNView>
              </RNView>
            );
          }}
          ListFooterComponent={
            timezone ? (
              <Text style={[styles.footer, { color: C.textTertiary }]}>
                {t("automation.timezone", { tz: timezone })}
              </Text>
            ) : null
          }
        />
      ) : null}

      {rows.length > 0 ? (
        <Fab onPress={openConsole} accessibilityLabel={t("automation.fab")} />
      ) : null}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonWrap: {
    marginTop: 4,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  separator: {
    height: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  jobName: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metaText: {
    fontSize: 13,
    flexShrink: 1,
    flex: 1,
  },
  footer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
