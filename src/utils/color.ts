import { Octop } from "@/constants/OctopTheme";

/**
 * Tile palette for agents/threads/knowledge bases that don't carry a server color.
 * Elegant Rose-adjacent hues used by the Ardot tiles (designs 03/08/11).
 */
const TILE_PALETTE = [
  "#E85D75", // rose
  "#8B5CF6", // violet
  "#0EA5E9", // sky
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EC4899", // pink
  "#6366F1", // indigo
  "#14B8A6", // teal
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1_000_003;
  }
  return hash;
}

/** Server-provided hex when present; otherwise a stable palette color keyed by id. */
export function tileColor(serverColor: string | null | undefined, fallbackKey: string): string {
  const trimmed = (serverColor ?? "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }
  return TILE_PALETTE[hashString(fallbackKey) % TILE_PALETTE.length];
}

/** First letter (Latin/CJK aware) of a display name for tile glyphs. */
export function tileInitial(name: string | null | undefined, fallback: string = "?"): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    return fallback;
  }
  const first = Array.from(trimmed)[0];
  return first.toUpperCase();
}

/** Default tile color constant re-exported for callers that need the brand rose. */
export const BRAND_TILE = Octop.brand;
