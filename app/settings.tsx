import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { Toggle } from "@/src/components/Toggle";
import { getProactiveCare, putProactiveCare } from "@/src/api/proactiveCare";
import type { ProactiveCareConfig } from "@/src/api/types";
import { useAuth } from "@/src/features/auth/AuthContext";
import { useSelectedAgent } from "@/src/features/agents/AgentContext";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { LocalePreference } from "@/src/i18n";
import { hostOfBaseUrl } from "@/src/utils/time";
import { tileInitial } from "@/src/utils/color";

const LANGUAGE_OPTIONS: LocalePreference[] = ["system", "en", "zh"];

/** Settings (design 19): profile card, SERVER, APP, NOTIFICATIONS, ABOUT, sign out. */
export default function SettingsScreen() {
  const C = useOctopTheme();
  const insets = useSafeAreaInsets();
  const { t, preference, setPreference } = useI18n();
  const { user, baseUrl, api, signOut, setBaseUrl } = useAuth();
  const { selectedAgentId } = useSelectedAgent();
  const [baseUrlInput, setBaseUrlInput] = useState(baseUrl ?? "");
  const [loggingOut, setLoggingOut] = useState(false);
  const [care, setCare] = useState<ProactiveCareConfig | null>(null);
  const [careBusy, setCareBusy] = useState(false);

  useEffect(() => {
    setBaseUrlInput(baseUrl ?? "");
  }, [baseUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedAgentId) {
      setCare(null);
      return;
    }
    void (async () => {
      try {
        const config = await getProactiveCare(api, selectedAgentId);
        if (!cancelled) {
          setCare(config);
        }
      } catch {
        if (!cancelled) {
          setCare(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, selectedAgentId]);

  const toggleCare = useCallback(
    async (next: boolean) => {
      if (!selectedAgentId || !care || careBusy) {
        return;
      }
      setCareBusy(true);
      const previous = care;
      setCare({ ...care, enabled: next });
      try {
        const saved = await putProactiveCare(api, selectedAgentId, { ...care, enabled: next });
        setCare(saved);
      } catch {
        setCare(previous);
      } finally {
        setCareBusy(false);
      }
    },
    [api, care, careBusy, selectedAgentId],
  );

  async function handleSaveBaseUrl() {
    if (baseUrlInput.trim() === (baseUrl ?? "")) return;
    await setBaseUrl(baseUrlInput);
    await signOut();
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = user?.display_name || user?.username || "—";
  const roleLabel = user?.role === "admin" ? "Admin" : "User";

  function languageLabel(option: LocalePreference): string {
    if (option === "system") return t("settings.language.system");
    if (option === "en") return t("settings.language.en");
    return t("settings.language.zh");
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RNView style={[styles.container, { backgroundColor: C.bgLayout }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 10, paddingBottom: Math.max(30, insets.bottom + 20) },
          ]}
        >
          <RNView style={styles.navRow}>
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
            <Text style={[styles.title, { color: C.text }]}>{t("settings.title")}</Text>
          </RNView>

          <RNView
            style={[
              styles.profileCard,
              {
                backgroundColor: C.bgElevated,
                borderColor: C.border,
                boxShadow: `0px 1px 3px ${C.cardShadow}`,
              },
            ]}
          >
            <RNView style={[styles.avatar, { backgroundColor: C.brand }]}>
              <Text style={[styles.avatarText, { color: C.onBrand }]}>
                {tileInitial(displayName)}
              </Text>
            </RNView>
            <RNView style={styles.profileBody}>
              <Text style={[styles.profileName, { color: C.text }]}>{displayName}</Text>
              <Text style={[styles.profileMeta, { color: C.textSecondary }]}>
                {`${roleLabel} · ${hostOfBaseUrl(baseUrl)}`}
              </Text>
            </RNView>
          </RNView>

          <Text style={[styles.sectionHeading, { color: C.textTertiary }]}>
            {t("settings.server")}
          </Text>
          <RNView style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
            <Text style={[styles.rowLabel, { color: C.text }]}>{t("login.baseUrl")}</Text>
            <TextInput
              style={[styles.inlineValue, { color: C.textSecondary, borderColor: C.borderInput, backgroundColor: C.bgSecondary }]}
              value={baseUrlInput}
              onChangeText={setBaseUrlInput}
              onEndEditing={handleSaveBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholderTextColor={C.textPlaceholder}
            />
            <Text style={[styles.hint, { color: C.textTertiary }]}>{t("settings.baseUrlHint")}</Text>
          </RNView>

          <Text style={[styles.sectionHeading, { color: C.textTertiary }]}>
            {t("settings.app")}
          </Text>
          <RNView style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
            <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.language")}</Text>
            <RNView style={styles.segmentRow}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = preference === option;
                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.segment,
                      {
                        borderColor: selected ? C.brand : C.border,
                        backgroundColor: selected ? C.brand : C.bgSecondary,
                      },
                    ]}
                    onPress={() => void setPreference(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.segmentText, { color: selected ? C.onBrand : C.textSecondary }]}>
                      {languageLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </RNView>

            <RNView style={[styles.valueRow, { borderBottomColor: C.borderSecondary }]}>
              <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.theme")}</Text>
              <RNView style={styles.themeValue}>
                <RNView style={[styles.themeDot, { backgroundColor: C.brand }]} />
                <Text style={[styles.valueText, { color: C.textSecondary }]}>
                  {t("settings.themeValue")}
                </Text>
              </RNView>
            </RNView>
          </RNView>

          <Text style={[styles.sectionHeading, { color: C.textTertiary }]}>
            {t("settings.notifications")}
          </Text>
          <RNView style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
            {selectedAgentId ? (
              <>
                <RNView style={[styles.valueRow, { borderBottomColor: C.borderSecondary }]}>
                  <Text style={[styles.rowLabel, { color: C.text }]}>
                    {t("settings.proactiveReminders")}
                  </Text>
                  <Toggle
                    value={care?.enabled ?? false}
                    onChange={(next) => void toggleCare(next)}
                    disabled={careBusy || !care}
                    accessibilityLabel={t("settings.proactiveReminders")}
                  />
                </RNView>
                <RNView style={[styles.valueRow, { borderBottomColor: C.borderSecondary }]}>
                  <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.checkEvery")}</Text>
                  <Text style={[styles.valueText, { color: C.textSecondary }]}>
                    {care
                      ? t("settings.intervalHours", {
                          min: care.min_interval_hours,
                          max: care.max_interval_hours,
                        })
                      : "—"}
                  </Text>
                </RNView>
                <RNView style={[styles.valueRow, { borderBottomColor: C.borderSecondary }]}>
                  <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.sendTo")}</Text>
                  <Text style={[styles.valueText, { color: C.textSecondary }]}>
                    {t("settings.mainChat")}
                  </Text>
                </RNView>
                <RNView style={styles.valueRow}>
                  <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.dnd")}</Text>
                  <Text style={[styles.valueText, { color: C.textSecondary }]}>
                    {care ? `${care.active_hours_end} – ${care.active_hours_start}` : "—"}
                  </Text>
                </RNView>
              </>
            ) : (
              <Text style={[styles.hint, { color: C.textTertiary }]}>
                {t("settings.needsAgent")}
              </Text>
            )}
          </RNView>

          <Text style={[styles.sectionHeading, { color: C.textTertiary }]}>
            {t("settings.about")}
          </Text>
          <RNView style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
            <Text style={[styles.aboutBody, { color: C.textSecondary }]}>
              {t("settings.aboutBody")}
            </Text>
            <Text style={[styles.aboutMeta, { color: C.textTertiary }]}>
              {t("settings.version")}
            </Text>
          </RNView>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              { backgroundColor: C.bgElevated, borderColor: C.dangerBg, borderWidth: 1 },
              loggingOut && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel={t("settings.logout")}
          >
            <Text style={[styles.logoutText, { color: C.danger }]}>{t("settings.logout")}</Text>
          </Pressable>
        </ScrollView>
      </RNView>
    </>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 8,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  profileBody: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
  },
  profileMeta: {
    fontSize: 13,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 4,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
  },
  inlineValue: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    flex: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingVertical: 9,
    alignItems: "center",
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  themeValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  themeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  valueText: {
    fontSize: 14,
  },
  aboutBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  aboutMeta: {
    fontSize: 13,
  },
  logoutButton: {
    marginTop: 14,
    borderRadius: 14,
    borderCurve: "continuous",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
