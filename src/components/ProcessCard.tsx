import { useState } from "react";
import { Pressable, StyleSheet, Text, View as RNView } from "react-native";
import { SymbolView } from "expo-symbols";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import type { ProcessState } from "@/src/features/chat/useChatTurn";
import { useI18n } from "@/src/i18n/I18nProvider";

/**
 * Process card (design 15): collapsible "Used N tools · M deep thinking" header;
 * expanded rows show tool name + query + Done chip, thinking in italics.
 */
export function ProcessCard(props: { process: ProcessState }) {
  const C = useOctopTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(true);

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
        <Text style={[styles.headerText, { color: C.textSecondary }]} numberOfLines={1}>
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

      {open
        ? props.process.items.map((item) => (
            <RNView key={item.id} style={styles.row}>
              <SymbolView
                name={
                  item.kind === "thinking"
                    ? ({ ios: "brain", android: "psychology", web: "psychology" } as unknown as Parameters<typeof SymbolView>[0]["name"])
                    : ({ ios: "wrench.and.screwdriver", android: "build", web: "build" } as unknown as Parameters<typeof SymbolView>[0]["name"])
                }
                tintColor={C.textTertiary}
                size={16}
              />
              <RNView style={styles.rowBody}>
                <Text style={[styles.toolName, { color: C.textSecondary }]} numberOfLines={1}>
                  {item.kind === "thinking" ? t("chat.thinking") : item.name}
                </Text>
                {item.detail ? (
                  <Text style={[styles.toolDetail, { color: C.textTertiary }]} numberOfLines={1}>
                    {item.detail}
                  </Text>
                ) : null}
              </RNView>
              {item.kind === "tool" ? (
                <RNView
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        item.status === "error" ? C.dangerBg : item.status === "done" ? C.successBg : C.bgTertiary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === "error" ? C.danger : item.status === "done" ? C.success : C.textTertiary,
                      },
                    ]}
                  >
                    {item.status === "error" ? t("automation.error") : t("chat.processDone")}
                  </Text>
                </RNView>
              ) : null}
            </RNView>
          ))
        : null}
    </RNView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 12,
    gap: 4,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
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
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
