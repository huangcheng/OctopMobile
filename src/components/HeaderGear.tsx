import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export function HeaderGear() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;

  return (
    <Pressable
      onPress={() => router.push("/settings")}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <SymbolView
        name={{
          ios: "gearshape",
          android: "settings",
          web: "settings",
        }}
        tintColor={tint}
        size={22}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 8,
    padding: 4,
  },
});
