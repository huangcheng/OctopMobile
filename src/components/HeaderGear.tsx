import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View as RNView } from "react-native";

import { useOctopTheme } from "@/src/components/useOctopTheme";

export function HeaderGear() {
  const C = useOctopTheme();
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <RNView style={[styles.iconWrap, { backgroundColor: C.brand, boxShadow: `0px 2px 6px ${C.brandShadow}` }]}>
        <SymbolView
          name={{
            ios: "gearshape.fill",
            android: "settings",
            web: "settings",
          }}
          tintColor={C.onBrand}
          size={18}
        />
      </RNView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 2,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
