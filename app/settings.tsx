import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { Text, View } from "@/components/Themed";
import { t } from "@/src/i18n";
import { useAuth } from "@/src/features/auth/AuthContext";

export default function SettingsScreen() {
  const { user, baseUrl, signOut, setBaseUrl } = useAuth();
  const [baseUrlInput, setBaseUrlInput] = useState(baseUrl ?? "");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setBaseUrlInput(baseUrl ?? "");
  }, [baseUrl]);

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

  return (
    <>
      <Stack.Screen options={{ title: t("settings.title") }} />
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>{t("login.baseUrl")}</Text>
        <TextInput
          style={styles.input}
          value={baseUrlInput}
          onChangeText={setBaseUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onEndEditing={handleSaveBaseUrl}
        />
        <Text style={styles.hint}>
          Changing the server URL signs you out and requires signing in again.
        </Text>

        <Text style={styles.sectionLabel}>{t("login.username")}</Text>
        <Text style={styles.value}>{displayName}</Text>

        <Pressable
          style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>{t("settings.logout")}</Text>
        </Pressable>

        <View style={styles.about}>
          <Text style={styles.aboutText}>{t("about.unofficial")}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
  },
  value: {
    fontSize: 16,
    paddingVertical: 4,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: "#b00020",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  about: {
    marginTop: "auto",
    paddingTop: 24,
  },
  aboutText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: "center",
  },
});
