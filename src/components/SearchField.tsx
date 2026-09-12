import { StyleSheet, TextInput, View as RNView } from "react-native";
import { SymbolView } from "expo-symbols";

import { useOctopTheme } from "@/src/components/useOctopTheme";

/** Search field (designs 08/11): 40pt pill, white + border, 16px search glyph. */
export function SearchField(props: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
}) {
  const C = useOctopTheme();

  return (
    <RNView
      style={[styles.field, { backgroundColor: C.bgElevated, borderColor: C.border }]}
      accessibilityRole="search"
    >
      <SymbolView
        name={{ ios: "magnifyingglass", android: "search", web: "search" } as unknown as Parameters<typeof SymbolView>[0]["name"]}
        tintColor={C.textTertiary}
        size={16}
      />
      <TextInput
        testID={props.testID}
        style={[styles.input, { color: C.text }]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={C.textPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      </RNView>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
});
