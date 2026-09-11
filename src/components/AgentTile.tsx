import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View as RNView } from "react-native";
import { SymbolView } from "expo-symbols";

import { useAuth } from "@/src/features/auth/AuthContext";
import { getToken } from "@/src/storage/secure";
import { expertGlyphForName, resolveAgentIconUrl } from "@/src/utils/expertIcon";

/**
 * Expert / thread identity tile (Ardot designs 03/08/10/11):
 * prefer uploaded ``icon_url`` (auth image) → Lucide ``icon_name`` glyph → letter.
 * `tone="solid"` = brand-color tile + white glyph (experts/threads).
 * `tone="tint"` = 12% pastel tile + colored glyph (KB cards, prompt tiles).
 */
export function AgentTile(props: {
  label: string;
  color: string;
  size?: number;
  radius?: number;
  iconUrl?: string | null;
  iconName?: string | null;
  tone?: "solid" | "tint";
  /** Colored drop shadow (hero tile, design 10). */
  glow?: boolean;
}) {
  const size = props.size ?? 44;
  const radius = props.radius ?? 12;
  const tone = props.tone ?? "solid";
  const fontSize = Math.round(size * 0.4);
  const glyphSize = Math.max(12, Math.round(size * 0.48));
  const { baseUrl } = useAuth();
  const absoluteUrl = resolveAgentIconUrl(baseUrl, props.iconUrl);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string> | undefined>();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    if (!absoluteUrl) {
      setAuthHeaders(undefined);
      return;
    }
    let cancelled = false;
    void (async () => {
      const token = await getToken();
      if (!cancelled) {
        setAuthHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [absoluteUrl]);

  const showImage = Boolean(absoluteUrl) && !imageFailed;
  const glyph = expertGlyphForName(props.iconName);
  const tintBg = `${props.color}1F`; // 12% alpha — Ardot KB tile pattern
  const fg = tone === "tint" ? props.color : "#FFFFFF";

  return (
    <RNView
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tone === "tint" && !showImage ? tintBg : props.color,
          boxShadow: props.glow ? `0px 8px 20px ${props.color}4D` : undefined,
          overflow: "hidden",
        },
      ]}
    >
      {showImage && absoluteUrl ? (
        <Image
          source={{ uri: absoluteUrl, headers: authHeaders }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : props.iconName || !props.label ? (
        <SymbolView
          name={glyph as unknown as Parameters<typeof SymbolView>[0]["name"]}
          tintColor={fg}
          size={glyphSize}
        />
      ) : (
        <Text style={[styles.glyph, { fontSize, color: fg }]}>{props.label}</Text>
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
