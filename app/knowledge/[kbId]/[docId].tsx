import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View as RNView } from "react-native";
import Markdown from "react-native-markdown-display";
import { SymbolView } from "expo-symbols";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ErrorBanner } from "@/src/components/ErrorBanner";
import { DocSkeleton } from "@/src/components/SkeletonList";
import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useToast } from "@/src/components/Toast";
import { buildMarkdownRules } from "@/src/components/markdownRules";
import { buildAssistantMarkdownStyles } from "@/src/components/markdownStyles";
import { previewDocument } from "@/src/api/knowledge";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useI18n } from "@/src/i18n/I18nProvider";

type SFSymbol = Parameters<typeof SymbolView>[0]["name"];

/**
 * Document reader (Ardot frame `iPhone / Document Reader`): extracted text
 * rendered as markdown in a card + Share Markdown CTA (RN Share, no deps).
 */
export default function DocumentReaderScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { api } = useAuth();
  const toast = useToast();
  const { kbId, docId, name, kbName } = useLocalSearchParams<{
    kbId: string;
    docId: string;
    name?: string;
    kbName?: string;
  }>();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!kbId || !docId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const preview = await previewDocument(api, kbId, docId);
      setText(preview.text);
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }, [api, kbId, docId, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const title = name ?? docId ?? "";
  const markdownStyles = buildAssistantMarkdownStyles(C);
  const markdownRules = buildMarkdownRules(C);

  async function share() {
    if (text === null) {
      return;
    }
    try {
      await Share.share({ message: `# ${title}\n\n${text}` });
    } catch {
      toast.show({ kind: "error", message: t("errors.actionFailed") });
    }
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
          {title}
        </Text>
        <RNView style={styles.headerSide} />
      </RNView>

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {loading ? (
        <RNView style={styles.scrollWrap}>
          <DocSkeleton />
        </RNView>
      ) : null}

      {!loading && !error && text !== null ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(24, insets.bottom + 96) },
          ]}
        >
          {kbName ? (
            <Text style={[styles.meta, { color: C.textTertiary }]} numberOfLines={1}>
              {kbName}
            </Text>
          ) : null}
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
            {text.trim().length > 0 ? (
              <Markdown style={markdownStyles} rules={markdownRules}>
                {text}
              </Markdown>
            ) : (
              <Text style={[styles.empty, { color: C.textSecondary }]}>
                {t("reader.empty")}
              </Text>
            )}
          </RNView>
        </ScrollView>
      ) : null}

      {!loading && !error ? (
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
            onPress={() => void share()}
            style={({ pressed }) => [styles.ctaPrimary, { backgroundColor: C.brand }, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={t("reader.share")}
          >
            <SymbolView
              name={{ ios: "square.and.arrow.up", android: "share", web: "share" } as unknown as SFSymbol}
              tintColor={C.onBrand}
              size={18}
            />
            <Text style={[styles.ctaText, { color: C.onBrand }]}>{t("reader.share")}</Text>
          </Pressable>
        </RNView>
      ) : null}
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
  scrollWrap: { paddingHorizontal: 16, paddingTop: 16 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  meta: { fontSize: 12 },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 16,
  },
  empty: { fontSize: 14, textAlign: "center", paddingVertical: 24 },
  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 15, fontWeight: "600" },
});
