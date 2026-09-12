import { Modal, StyleSheet, Text, View as RNView } from "react-native";
import * as Haptics from "expo-haptics";

import { PressableScale } from "@/src/components/PressableScale";
import { useOctopTheme } from "@/src/components/useOctopTheme";
import { useI18n } from "@/src/i18n/I18nProvider";

/**
 * Cleartext HTTP warning (design 02): centered dialog with amber warning glyph,
 * title, body, Cancel + "Continue once" rose pill. Rendered by AuthProvider.
 */
export function CleartextDialog(props: {
  visible: boolean;
  onAnswer: (accept: boolean) => void;
}) {
  const C = useOctopTheme();
  const { t } = useI18n();
  if (!props.visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => props.onAnswer(false)}>
      <RNView style={[styles.scrim, { backgroundColor: C.scrim }]}>
        <RNView style={[styles.dialog, { backgroundColor: C.bgElevated }]}>
          <RNView style={[styles.iconWrap, { backgroundColor: C.warningBg }]}>
            <Text style={styles.icon}>⚠</Text>
          </RNView>
          <Text style={[styles.title, { color: C.text }]}>{t("login.cleartextTitle")}</Text>
          <Text style={[styles.body, { color: C.textSecondary }]}>{t("login.cleartextBody")}</Text>
          <RNView style={styles.buttonRow}>
            <PressableScale
              onPress={() => {
                void Haptics.selectionAsync();
                props.onAnswer(false);
              }}
              style={styles.flex}
              contentStyle={[styles.cancelButton, { borderColor: C.border }]}
              accessibilityRole="button"
              accessibilityLabel={t("login.cleartextCancel")}
            >
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>
                {t("login.cleartextCancel")}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onAnswer(true);
              }}
              style={styles.flexContinue}
              contentStyle={[styles.continueButton, { backgroundColor: C.brand }]}
              accessibilityRole="button"
              accessibilityLabel={t("login.cleartextContinue")}
            >
              <Text style={[styles.continueText, { color: C.onBrand }]}>
                {t("login.cleartextContinue")}
              </Text>
            </PressableScale>
          </RNView>
        </RNView>
      </RNView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  dialog: {
    width: "100%",
    borderRadius: 22,
    borderCurve: "continuous",
    padding: 22,
    alignItems: "center",
    gap: 10,
    boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.18)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    alignSelf: "stretch",
  },
  flex: {
    flex: 1,
  },
  flexContinue: {
    flex: 1.4,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  continueButton: {
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    paddingVertical: 12,
  },
  continueText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
