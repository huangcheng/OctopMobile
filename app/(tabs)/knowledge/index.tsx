import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View as RNView } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { Fab } from "@/src/components/Fab";
import { HeaderGear } from "@/src/components/HeaderGear";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { SearchField } from "@/src/components/SearchField";
import { SkeletonList } from "@/src/components/SkeletonList";
import { AgentTile } from "@/src/components/AgentTile";
import { listKnowledgeBases, listKnowledgeDocuments } from "@/src/api/knowledge";
import type { KnowledgeBase } from "@/src/api/types";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor, tileInitial } from "@/src/utils/color";
import { formatRelativeTime } from "@/src/utils/time";

const KB_TILE_KEY = "kb";

type KnowledgeRow = KnowledgeBase & { docCount: number | null };

/** Knowledge bases, read-only (design 11): MY BASES cards with doc counts + Shared badge. */
export default function KnowledgeScreen() {
  const C = useOctopTheme();
  const { t, locale } = useI18n();
  const { api, baseUrl } = useAuth();
  const [rows, setRows] = useState<KnowledgeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(false);
    try {
      const bases = await listKnowledgeBases(api);
      const withCounts = await Promise.all(
        bases.map(async (base): Promise<KnowledgeRow> => {
          try {
            const docs = await listKnowledgeDocuments(api, base.id);
            return { ...base, docCount: docs.length };
          } catch {
            return { ...base, docCount: null };
          }
        }),
      );
      setRows(withCounts);
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        (err as { status?: number }).status === 403
      ) {
        setDisabled(true);
      } else {
        setError(t("errors.network"));
      }
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  const [pulling, setPulling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function handlePull() {
    setPulling(true);
    await refresh();
    setPulling(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        (row.description ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  function openConsole() {
    if (baseUrl) {
      void WebBrowser.openBrowserAsync(baseUrl);
    }
  }

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <ScreenHeader title={t("knowledge.title")} action={<HeaderGear />} />

      {rows.length > 0 ? (
        <RNView style={styles.searchWrap}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={t("knowledge.searchPlaceholder")}
          />
        </RNView>
      ) : null}

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {filtered.length > 0 ? (
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{t("knowledge.mine")}</Text>
      ) : null}

      {loading && rows.length === 0 ? (
        <RNView style={styles.skeletonWrap}>
          <SkeletonList rows={3} />
        </RNView>
      ) : null}

      {disabled && !loading ? (
        <RNView style={styles.centerWrap}>
          <Text style={[styles.disabledText, { color: C.textSecondary }]} numberOfLines={3}>
            {t("knowledge.disabled")}
          </Text>
        </RNView>
      ) : null}

      {!loading && !error && !disabled && rows.length === 0 ? (
        <EmptyState
          title={t("knowledge.emptyTitle")}
          subtitle={t("knowledge.emptySubtitle")}
          ctaLabel={t("knowledge.emptyCta")}
          onCta={openConsole}
        />
      ) : null}

      {filtered.length > 0 ? (
        <FlatList<KnowledgeRow>
          style={styles.listFlex}
          showsVerticalScrollIndicator={false}
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={pulling} onRefresh={handlePull} tintColor={C.brand} />
          }
          contentContainerStyle={styles.list}
          // Avoid contentContainerStyle `gap` — FlatList remount/focus can stack rows.
          ItemSeparatorComponent={() => <RNView style={styles.separator} />}
          renderItem={({ item }) => {
            const updated = item.updated_at ?? item.created_at ?? null;
            const metaParts: string[] = [];
            if (item.docCount !== null) {
              metaParts.push(t("knowledge.docs", { count: item.docCount }));
            }
            if (updated) {
              metaParts.push(t("knowledge.updatedAt", { time: formatRelativeTime(updated, locale) }));
            }

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
                <RNView style={styles.cardRow}>
                  <AgentTile
                    label=""
                    color={tileColor(null, KB_TILE_KEY + item.id)}
                    iconName="book-open"
                    tone="tint"
                  />
                  <RNView style={styles.cardBody}>
                    <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {metaParts.length > 0 ? (
                      <Text style={[styles.meta, { color: C.textTertiary }]} numberOfLines={1}>
                        {metaParts.join(" · ")}
                      </Text>
                    ) : null}
                  </RNView>
                  {item.shared ? (
                    <RNView style={[styles.sharedBadge, { backgroundColor: C.infoBg }]}>
                      <Text style={[styles.sharedText, { color: C.info }]}>
                        {t("knowledge.shared")}
                      </Text>
                    </RNView>
                  ) : null}
                </RNView>
              </RNView>
            );
          }}
          ListFooterComponent={
            <RNView style={[styles.tipCard, { backgroundColor: C.brandSoft }]}>
              <Text style={[styles.tip, { color: C.brandActive }]}>{t("knowledge.tip")}</Text>
            </RNView>
          }
        />
      ) : null}

      {rows.length > 0 ? (
        <Fab onPress={openConsole} accessibilityLabel={t("knowledge.fab")} />
      ) : null}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  skeletonWrap: {
    marginTop: 4,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    // Match EmptyState: clear floating PillTabBar chrome when centering.
    paddingBottom: 110,
  },
  disabledText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 10,
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
  card: {
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
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  sharedBadge: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  sharedText: {
    fontSize: 10,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
  },
  tipCard: {
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tip: {
    fontSize: 13,
    lineHeight: 18,
  },
});
