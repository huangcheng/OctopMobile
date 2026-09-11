import { useEffect, useState } from "react";
import { Image, StyleSheet, View as RNView } from "react-native";
import { SymbolView } from "expo-symbols";

import { useAuth } from "@/src/features/auth/AuthContext";
import { getToken } from "@/src/storage/secure";
import { expertGlyphForName, resolveAgentIconUrl } from "@/src/utils/expertIcon";

/**
 * Expert / thread identity tile (Ardot designs 03/08/10/11):
 * prefer uploaded ``icon_url`` (auth image) → Lucide ``icon_name`` glyph →
 * generic sparkles glyph (no letter initials — they read as noise).
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
  const glyphSize = Math.max(12, Math.round(size * 0.48));
  const { baseUrl } = useAuth();
  const absoluteUrl = resolveAgentIconUrl(baseUrl, props.iconUrl);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string> | undefined>();
  const [headersReady, setHeadersReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    if (!absoluteUrl) {
      setAuthHeaders(undefined);
      setHeadersReady(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const token = await getToken();
      if (!cancelled) {
        setAuthHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
        setHeadersReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [absoluteUrl]);

  // Render the image only once auth headers are attached — fetching early
  // without them 401s the avatar endpoint and sticks the tile on the glyph.
  const showImage = Boolean(absoluteUrl) && !imageFailed && headersReady;
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
      ) : (
        // No letter initials — a bare "D"/"E" reads as noise. Always a glyph.
        <SymbolView
          name={glyph as unknown as Parameters<typeof SymbolView>[0]["name"]}
          tintColor={fg}
          size={glyphSize}
        />
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
});
