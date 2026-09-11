import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { t } from "@/src/i18n";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { mapAuthError, useAuth } from "@/src/features/auth/AuthContext";

export default function LoginScreen() {
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{t("login.title")}</Text>
        <Text style={styles.subtitle}>{t("about.unofficial")}</Text>

        {error ? <ErrorBanner message={error} /> : null}

        <Text style={styles.label}>{t("login.baseUrl")}</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://octop.example.com"
          editable={!pending}
        />

        <Text style={styles.label}>{t("login.username")}</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!pending}
        />

        <Text style={styles.label}>{t("login.password")}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!pending}
        />

        <Pressable
          style={[styles.button, pending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={pending}
          accessibilityRole="button"
        >
          {pending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("login.submit")}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: "#2f95dc",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
