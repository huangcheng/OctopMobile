import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View as RNView } from "react-native";
import { SymbolView } from "expo-symbols";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import type { ProcessState } from "@/src/features/chat/useChatTurn";
import { useI18n } from "@/src/i18n/I18nProvider";

/**
 * Process card (design 15): collapsible "Used N tools · M deep thinking" header;
 * expanded rows show tool name + query + Done chip, thinking in italics.
 * Behaves like Qwen/Doubao/DeepSeek: expanded while the turn is working,
 * collapsed to the one-line summary once every item settles; a manual tap
 * overrides until the next running→settled transition.
 */
export function ProcessCard(props: { process: ProcessState }) {
  const C = useOctopTheme();
  const { t } = useI18n();
  const isRunning = props.process.items.some((item) => item.status === "running");
  const [open, setOpen] = useState(isRunning);

  useEffect(() => {
    setOpen(isRunning);
  }, [isRunning]);

  if (props.process.items.length === 0) {
    return null;
  }

  return (
    <RNView
      style={[
        styles.card,
        { backgroundColor: C.bgElevated, borderColor: C.border, boxShadow: `0px 1px 3px ${C.cardShadow}` },
      ]}
    >
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel={t("chat.processSummary", {
          tools: props.process.toolCount,
          thinking: props.process.thinkingCount,
        })}
      >
        <Text style={[styles.headerText, { color: C.text }]} numberOfLines={1}>
          {t("chat.processSummary", {
            tools: props.process.toolCount,
            thinking: props.process.thinkingCount,
          })}
        </Text>
        <SymbolView
          name={{
            ios: open ? "chevron.up" : "chevron.down",
            android: open ? "expand_less" : "expand_more",
            web: open ? "expand_less" : "expand_more",
          } as unknown as Parameters<typeof SymbolView>[0]["name"]}
          tintColor={C.textTertiary}
          size={14}
        />
      </Pressable>

      {open ? <RNView style={[styles.divider, { backgroundColor: C.borderSecondary }]} /> : null}

      {open
        ? props.process.items.map((item) =>
            item.kind === "thinking" ? (
              <Text
                key={item.id}
                style={[styles.thinkingText, { color: C.textTertiary }]}
                numberOfLines={2}
              >
                {item.detail ?? t("chat.thinking")}
              </Text>
            ) : (
              <RNView key={item.id}>
                <RNView style={styles.row}>
                  <RNView style={[styles.toolIcon, { backgroundColor: C.bgTertiary }]}>
                    <SymbolView
                      name={
                        { ios: "wrench.and.screwdriver", android: "build", web: "build" } as unknown as Parameters<typeof SymbolView>[0]["name"]
                      }
                      tintColor={C.textTertiary}
                      size={13}
                    />
                  </RNView>
                  <RNView style={styles.rowBody}>
                    <Text style={[styles.toolName, { color: C.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.detail ? (
                      <Text style={[styles.toolDetail, { color: C.textTertiary }]} numberOfLines={1}>
                        {item.detail}
                      </Text>
                    ) : null}
                  </RNView>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === "error"
                            ? C.danger
                            : item.status === "done"
                              ? C.success
                              : C.textTertiary,
                      },
                    ]}
                  >
                    {item.status === "error"
                      ? t("automation.error")
                      : item.status === "done"
                        ? t("chat.processDone")
                        : t("chat.processRunning")}
                  </Text>
                </RNView>
                {item.result ? (
                  <RNView style={[styles.toolResult, { backgroundColor: C.bgTertiary }]}>
                    <Text
                      style={[styles.toolResultText, { color: C.textSecondary }]}
                      numberOfLines={4}
                    >
                      {item.result}
                    </Text>
                  </RNView>
                ) : null}
              </RNView>
            ),
          )
        : null}
    </RNView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "flex-start",
    width: 320,
    maxWidth: "100%",
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  divider: {
    height: 1,
  },
  thinkingText: {
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolResult: {
    marginTop: 6,
    marginLeft: 32,
    borderRadius: 8,
    borderCurve: "continuous",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toolResultText: {
    fontSize: 11,
    lineHeight: 16,
  },
  toolIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 1,
  },
  toolName: {
    fontSize: 12,
    fontWeight: "600",
  },
  toolDetail: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
