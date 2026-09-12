import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View as RNView,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOctopTheme } from "@/src/components/useOctopTheme";
import { PALETTE_KEYS } from "@/constants/OctopTheme";
import { ActionSheet } from "@/src/components/ActionSheet";
import { Toggle } from "@/src/components/Toggle";
import { selectPalette, usePalette } from "@/src/features/theme/paletteStore";
import { selectThemeMode, useThemeMode } from "@/src/features/theme/themeModeStore";
import { useToast } from "@/src/components/Toast";
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
  const toast = useToast();
  const [baseUrlInput, setBaseUrlInput] = useState(baseUrl ?? "");
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [care, setCare] = useState<ProactiveCareConfig | null>(null);
  const [careBusy, setCareBusy] = useState(false);
  const [langSheet, setLangSheet] = useState(false);
  const [paletteSheet, setPaletteSheet] = useState(false);
  const [appearanceSheet, setAppearanceSheet] = useState(false);
  const palette = usePalette();
  const themeMode = useThemeMode();

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
        toast.show({ kind: "error", message: t("errors.actionFailed") });
      } finally {
        setCareBusy(false);
      }
    },
    [api, care, careBusy, selectedAgentId, t, toast],
  );

  async function handleSaveBaseUrl() {
    if (baseUrlInput.trim() === (baseUrl ?? "")) return;
    await setBaseUrl(baseUrlInput);
    await signOut();
  }

  async function saveAndClose() {
    try {
      await handleSaveBaseUrl();
      setUrlError(null);
      setEditingUrl(false);
    } catch {
      setUrlError(t("settings.baseUrlInvalid"));
    }
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
          showsVerticalScrollIndicator={false}
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
                tintColor={C.brand}
                size={20}
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
      <RNView style={[styles.avatar, { backgroundColor: C.brandSoft }]}>
      <Text style={[styles.avatarText, { color: C.brandText }]}>
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
      <Pressable
            style={[styles.card, styles.serverRow, { backgroundColor: C.bgElevated, borderColor: C.border }]}
            onPress={() => setEditingUrl(true)}
            accessibilityRole="button"
            accessibilityLabel={t("login.baseUrl")}
          >
      <Text style={[styles.rowLabel, { color: C.text }]}>{t("login.baseUrl")}</Text>
      <Text style={[styles.valueText, { color: C.textSecondary }]} numberOfLines={1}>
              {hostOfBaseUrl(baseUrl)}
            </Text>
      </Pressable>
      <Text style={[styles.sectionHeading, { color: C.textTertiary }]}>
            {t("settings.app")}
          </Text>
      <RNView style={[styles.card, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
      <Pressable
              onPress={() => setLangSheet(true)}
              style={[styles.valueRow, { borderBottomColor: C.borderSecondary }]}
              accessibilityRole="button"
              accessibilityLabel={t("settings.language")}
            >
      <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.language")}</Text>
      <Text style={[styles.valueText, { color: C.textSecondary }]}>
                {languageLabel(preference)}
              </Text>
      </Pressable>
      <Pressable
              onPress={() => setAppearanceSheet(true)}
              style={[styles.valueRow, { borderBottomColor: C.borderSecondary }]}
              accessibilityRole="button"
              accessibilityLabel={t("settings.appearance")}
            >
      <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.appearance")}</Text>
      <Text style={[styles.valueText, { color: C.textSecondary }]}>
                {t(`settings.appearance.${themeMode}`)}
              </Text>
      </Pressable>
      <Pressable
              onPress={() => setPaletteSheet(true)}
              style={[styles.valueRow, styles.valueRowLast]}
              accessibilityRole="button"
              accessibilityLabel={t("settings.theme")}
            >
      <Text style={[styles.rowLabel, { color: C.text }]}>{t("settings.theme")}</Text>
      <RNView style={styles.themeValue}>
      <RNView style={[styles.themeDot, { backgroundColor: C.brand }]} />
      <Text style={[styles.valueText, { color: C.textSecondary }]}>
                  {t(`palette.${palette}`)}
                </Text>
      </RNView>
      </Pressable>
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
      <RNView style={[styles.valueRow, styles.valueRowLast]}>
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
      <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.serverRow,
              { backgroundColor: C.bgElevated, borderColor: C.border },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/about")}
            accessibilityRole="button"
            accessibilityLabel={t("about.title")}
          >
      <Text style={[styles.rowLabel, { color: C.text }]}>{t("about.title")}</Text>
      <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as unknown as Parameters<typeof SymbolView>[0]["name"]}
              tintColor={C.textTertiary}
              size={16}
            />
      </Pressable>
      <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              { backgroundColor: C.bgElevated, borderColor: C.border, borderWidth: 1 },
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
      <ActionSheet
          visible={langSheet}
          title={t("settings.language")}
          onDismiss={() => setLangSheet(false)}
          actions={LANGUAGE_OPTIONS.map((option) => ({
            key: option,
            label: languageLabel(option),
            icon: { ios: "globe", android: "language", web: "language" },
            onPress: () => {
              void setPreference(option);
              setLangSheet(false);
            },
          }))}
        />
      <ActionSheet
          visible={appearanceSheet}
          title={t("settings.appearance")}
          onDismiss={() => setAppearanceSheet(false)}
          actions={(["system", "light", "dark"] as const).map((mode) => ({
            key: mode,
            label: t(`settings.appearance.${mode}`),
            icon:
              mode === "dark"
                ? { ios: "moon.fill", android: "dark_mode", web: "dark_mode" }
                : mode === "light"
                  ? { ios: "sun.max.fill", android: "light_mode", web: "light_mode" }
                  : { ios: "circle.lefthalf.filled", android: "brightness_auto", web: "brightness_auto" },
            onPress: () => {
              void selectThemeMode(mode);
              setAppearanceSheet(false);
            },
          }))}
        />
      <ActionSheet
          visible={paletteSheet}
          title={t("settings.theme")}
          onDismiss={() => setPaletteSheet(false)}
          actions={PALETTE_KEYS.map((key) => ({
            key,
            label: t(`palette.${key}`),
            icon: { ios: "paintpalette", android: "palette", web: "palette" },
            onPress: () => {
              void selectPalette(key);
              setPaletteSheet(false);
            },
          }))}
        />
      <Modal
          transparent
          visible={editingUrl}
          animationType="fade"
          onRequestClose={() => setEditingUrl(false)}
        >
      <KeyboardAvoidingView behavior="padding" style={styles.dialogKav}>
      <RNView style={[styles.dialogScrim, { backgroundColor: C.scrim }]}>
      <RNView style={[styles.dialog, { backgroundColor: C.bgElevated }]}>
      <Text style={[styles.dialogTitle, { color: C.text }]}>{t("login.baseUrl")}</Text>
      <TextInput
                style={[styles.dialogInput, { borderColor: C.borderInput, color: C.text }]}
                value={baseUrlInput}
                onChangeText={setBaseUrlInput}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={() => void saveAndClose()}
                placeholder="https://octop.example.com"
                placeholderTextColor={C.textPlaceholder}
              />
      <Text style={[styles.hint, { color: C.textTertiary }]}>
                {t("settings.baseUrlHint")}
              </Text>
              {urlError ? (
                <Text style={[styles.hint, { color: C.danger }]}>{urlError}</Text>
              ) : null}
              <RNView style={styles.dialogRow}>
      <Pressable
                  onPress={() => setEditingUrl(false)}
                  style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}
                >
      <Text style={[styles.dialogCancel, { color: C.textSecondary }]}>
                    {t("chats.cancel")}
                  </Text>
      </Pressable>
      <Pressable
                  onPress={() => void saveAndClose()}
                  style={({ pressed }) => [
                    styles.dialogButton,
                    { backgroundColor: C.brand },
                    pressed && styles.pressed,
                  ]}
                >
      <Text style={[styles.dialogSave, { color: C.onBrand }]}>
                    {t("chats.renameSave")}
                  </Text>
      </Pressable>
      </RNView>
      </RNView>
      </RNView>
      </KeyboardAvoidingView>
      </Modal>
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
  serverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
  dialogKav: {
    flex: 1,
  },
  dialogScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  dialog: {
    width: "100%",
    borderRadius: 20,
    borderCurve: "continuous",
    padding: 20,
    gap: 14,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  dialogRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  dialogButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    borderCurve: "continuous",
  },
  dialogCancel: {
    fontSize: 15,
    fontWeight: "600",
  },
  dialogSave: {
    fontSize: 15,
    fontWeight: "700",
  },
  valueRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
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
    borderRadius: 16,
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
