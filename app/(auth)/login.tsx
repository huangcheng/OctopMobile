import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View as RNView,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/src/components/PressableScale";
import { useOctopTheme } from "@/src/components/useOctopTheme";
import { OCTOP_SERVER_VERSION } from "@/constants/appInfo";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { mapAuthError, useAuth } from "@/src/features/auth/AuthContext";
import { useI18n } from "@/src/i18n/I18nProvider";

/** Login (design 01): warm paper bg, logo + tagline, three fields, rose Sign in, footnotes. */
export default function LoginScreen() {
  const C = useOctopTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { baseUrl: storedBaseUrl, signIn } = useAuth();
  const [baseUrl, setBaseUrlInput] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storedBaseUrl) {
      setBaseUrlInput(storedBaseUrl);
    }
  }, [storedBaseUrl]);

  async function handleSubmit() {
    setError(null);
    setPending(true);
    try {
      await signIn(baseUrl, username, password);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
    >
      <RNView style={[styles.container, { backgroundColor: C.bgLogin }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Math.max(24, insets.top + 16),
              paddingBottom: Math.max(24, insets.bottom + 16),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <RNView style={styles.hero}>
            <Image
              source={require("@/assets/images/pwa-512.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={[styles.brand, { color: C.text }]}>Octop</Text>
            <Text style={[styles.tagline, { color: C.textSecondary }]}>
              {t("login.tagline")}
            </Text>
          </RNView>

          {error ? <ErrorBanner message={error} /> : null}

          <RNView style={[styles.formCard, { backgroundColor: C.bgElevated, borderColor: C.border, boxShadow: `0px 1px 3px ${C.cardShadow}` }]}>
            <Text style={[styles.label, { color: C.textSecondary }]}>{t("login.baseUrl")}</Text>
            <TextInput
              testID="login-base-url"
              style={[styles.input, { borderColor: C.borderInput, backgroundColor: C.bgSecondary, color: C.text }]}
              value={baseUrl}
              onChangeText={setBaseUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://octop.example.com"
              placeholderTextColor={C.textPlaceholder}
              editable={!pending}
            />

            <Text style={[styles.label, { color: C.textSecondary }]}>{t("login.username")}</Text>
            <TextInput
              testID="login-username"
              style={[styles.input, { borderColor: C.borderInput, backgroundColor: C.bgSecondary, color: C.text }]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("login.usernamePlaceholder")}
              placeholderTextColor={C.textPlaceholder}
              editable={!pending}
            />

            <Text style={[styles.label, { color: C.textSecondary }]}>{t("login.password")}</Text>
            <TextInput
              testID="login-password"
              style={[styles.input, { borderColor: C.borderInput, backgroundColor: C.bgSecondary, color: C.text }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={C.textPlaceholder}
              editable={!pending}
            />

            <PressableScale
              contentStyle={[
                styles.button,
                { backgroundColor: C.brand },
                pending && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={pending}
              accessibilityRole="button"
              accessibilityLabel={t("login.submit")}
            >
              {pending ? (
                <ActivityIndicator color={C.onBrand} />
              ) : (
                <Text style={[styles.buttonText, { color: C.onBrand }]}>{t("login.submit")}</Text>
              )}
            </PressableScale>
          </RNView>

          <Text style={[styles.securityNote, { color: C.textTertiary }]}>
            {t("login.securityNote")}
          </Text>
          <Text style={[styles.footer, { color: C.textTertiary }]}>
            {t("login.footer", { octopVersion: OCTOP_SERVER_VERSION })}
          </Text>
        </ScrollView>
      </RNView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    justifyContent: "center",
    flexGrow: 1,
    gap: 18,
  },
  hero: {
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 6,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  tagline: {
    fontSize: 15,
  },
  formCard: {
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 20,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 22,
    borderRadius: 14,
    borderCurve: "continuous",
    paddingVertical: 15,
    alignItems: "center",
    boxShadow: "0px 4px 10px rgba(232, 93, 117, 0.3)",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  securityNote: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  footer: {
    fontSize: 12,
    textAlign: "center",
  },
});
