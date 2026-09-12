import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View as RNView } from "react-native";
import { Share } from "react-native";
import { SymbolView } from "expo-symbols";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AgentTile } from "@/src/components/AgentTile";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { SkeletonList } from "@/src/components/SkeletonList";
import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useToast } from "@/src/components/Toast";
import { listKnowledgeDocuments, listKnowledgeBases } from "@/src/api/knowledge";
import type { KnowledgeBase, KnowledgeDocument } from "@/src/api/types";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tileColor } from "@/src/utils/color";
import { formatRelativeTime } from "@/src/utils/time";

type SFSymbol = Parameters<typeof SymbolView>[0]["name"];

const KB_TILE_KEY = "kb";

function docTitle(doc: KnowledgeDocument): string {
  const extra = doc as { title?: unknown; name?: unknown };
  return ((doc.filename ?? extra.title ?? extra.name ?? doc.id) as string) ?? "";
}

function docUpdatedAt(doc: KnowledgeDocument): string | null {
  const extra = doc as { updated_at?: unknown };
  const value = extra.updated_at ?? doc.created_at ?? null;
  return typeof value === "string" ? value : null;
}

/** Knowledge base detail (Ardot frame `iPhone / Knowledge Detail`): hero + DOCUMENTS + manage CTA. */
export default function KnowledgeDetailScreen() {
  const C = useOctopTheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { api, baseUrl } = useAuth();
  const toast = useToast();
  const { kbId, name } = useLocalSearchParams<{ kbId: string; name?: string }>();
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!kbId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [bases, documents] = await Promise.all([
        listKnowledgeBases(api),
        listKnowledgeDocuments(api, kbId),
      ]);
      setKb(bases.find((b) => b.id === kbId) ?? null);
      setDocs(documents.filter((d) => !(d as { is_dir?: boolean }).is_dir));
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }, [api, kbId, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const kbName = kb?.name ?? name ?? "";
  const updated = kb?.updated_at ?? kb?.created_at ?? null;
  const metaParts = [
    t("knowledge.docs", { count: docs.length }),
    updated ? t("knowledge.updatedAt", { time: formatRelativeTime(updated, locale) }) : null,
  ].filter(Boolean) as string[];

  function openDoc(doc: KnowledgeDocument) {
    router.push({
      pathname: "/knowledge/[kbId]/[docId]",
      params: { kbId, docId: doc.id, name: docTitle(doc) },
    });
  }

  async function shareBaseLink() {
    if (!baseUrl) {
      return;
    }
    try {
      await Share.share({
        message: `${kbName} — ${baseUrl.replace(/\/+$/, "")}/knowledge-bases`,
      });
    } catch {
      toast.show({ kind: "error", message: t("errors.actionFailed") });
    }
  }

  function openConsole() {
    router.push({
      pathname: "/console",
      params: { path: "/knowledge-bases", title: t("knowledge.title") },
    });
  }

  return (
    <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
      <RNView style={[styles.header, { paddingTop: Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0) + 8 }]}>
      <RNView style={styles.headerSide}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back" accessibilityRole="button">
      <SymbolView
              name={{ ios: "chevron.left", android: "arrow-back", web: "arrow_back" } as unknown as SFSymbol}
              tintColor={C.brand}
              size={20}
            />
      </Pressable>
      </RNView>
      <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          {t("knowledge.detailTitle")}
        </Text>
      <RNView style={styles.headerSide} />
      </RNView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(24, insets.bottom + 96) },
        ]}
      >
        {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

        {loading ? <SkeletonList rows={3} /> : null}

        {!loading && !error ? (
          <>
      <RNView style={styles.hero}>
      <AgentTile
                label=""
                color={tileColor(null, KB_TILE_KEY + kbId)}
                iconName="book-open"
                tone="tint"
              />
      <Text style={[styles.heroName, { color: C.text }]} numberOfLines={2}>
                {kbName}
              </Text>
              {metaParts.length > 0 ? (
                <Text style={[styles.heroMeta, { color: C.textTertiary }]} numberOfLines={1}>
                  {metaParts.join(" · ")}
                </Text>
              ) : null}
            </RNView>
      <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>
              {t("knowledge.documents")}
            </Text>

            {docs.length === 0 ? (
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                {t("knowledge.noDocs")}
              </Text>
            ) : (
              docs.map((doc) => {
                const title = docTitle(doc);
                const docUpdated = docUpdatedAt(doc);
                const status: string | null = typeof doc.status === "string" ? doc.status : null;
                const docMeta = [
                  status ? status.charAt(0).toUpperCase() + status.slice(1) : null,
                  docUpdated
                    ? t("knowledge.updatedAt", { time: formatRelativeTime(docUpdated, locale) })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => openDoc(doc)}
                    style={({ pressed }) => [
                      styles.docCard,
                      {
                        backgroundColor: C.bgElevated,
                        borderColor: C.border,
                        boxShadow: `0px 1px 3px ${C.cardShadow}`,
                      },
                      pressed && { backgroundColor: C.bgTertiary },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={title}
                  >
      <RNView
                      style={[
                        styles.docTile,
                        { backgroundColor: `${C.info}1F` },
                      ]}
                    >
      <SymbolView
                        name={{ ios: "doc.text", android: "description", web: "description" } as unknown as SFSymbol}
                        tintColor={C.info}
                        size={18}
                      />
      </RNView>
      <RNView style={styles.docBody}>
      <Text style={[styles.docTitle, { color: C.text }]} numberOfLines={1}>
                        {title}
                      </Text>
      <Text style={[styles.docMeta, { color: C.textTertiary }]} numberOfLines={1}>
                        {docMeta}
                      </Text>
      </RNView>
      <SymbolView
                      name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as unknown as SFSymbol}
                      tintColor={C.textTertiary}
                      size={14}
                    />
      </Pressable>
                );
              })
            )}

            <RNView style={[styles.hint, { backgroundColor: C.brandSoft }]}>
      <Text style={[styles.hintText, { color: C.brandActive }]}>
                {t("knowledge.manageHint")}
              </Text>
      </RNView>
      </>
        ) : null}
      </ScrollView>
      <RNView
        style={[
          styles.ctaBar,
          {
            backgroundColor: C.bgElevated,
            borderColor: C.border,
            paddingBottom: Math.max(16, insets.bottom + 12),
          },
        ]}
      >
      <Pressable
          onPress={() => void shareBaseLink()}
          style={({ pressed }) => [
            styles.ctaSquare,
            { backgroundColor: C.bgElevated, borderColor: C.border },
            pressed && { backgroundColor: C.bgTertiary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("knowledge.shareBase")}
        >
      <SymbolView
            name={{ ios: "square.and.arrow.up", android: "share", web: "share" } as unknown as SFSymbol}
            tintColor={C.brand}
            size={20}
          />
      </Pressable>
      <Pressable
          onPress={openConsole}
          style={({ pressed }) => [
            styles.ctaPrimary,
            { backgroundColor: C.brand },
            pressed && { opacity: 0.88 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("knowledge.manageCta")}
        >
      <Text style={[styles.ctaPrimaryText, { color: C.onBrand }]}>
            {t("knowledge.manageCta")}
          </Text>
      </Pressable>
      </RNView>
      </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerSide: { width: 28, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", textAlign: "center" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  hero: { alignItems: "center", gap: 10, paddingVertical: 8 },
  heroName: { fontSize: 20, fontWeight: "600", textAlign: "center" },
  heroMeta: { fontSize: 13 },
  sectionLabel: { fontSize: 12, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 24 },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 12,
  },
  docTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docBody: { flex: 1, gap: 2 },
  docTitle: { fontSize: 15, fontWeight: "500" },
  docMeta: { fontSize: 12 },
  hint: { borderRadius: 16, borderCurve: "continuous", padding: 14, marginTop: 4 },
  hintText: { fontSize: 13, lineHeight: 18 },
  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimaryText: { fontSize: 15, fontWeight: "600" },
});
