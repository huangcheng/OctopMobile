/**
 * Map Octop dashboard Lucide ``icon_name`` keys → SF Symbol / Material names
 * for expo-symbols. Unknown names fall back to a generic layers glyph.
 */
export type ExpertGlyph = { ios: string; android: string; web: string };

const DEFAULT_GLYPH: ExpertGlyph = {
  ios: "square.stack.3d.up.fill",
  android: "layers",
  web: "layers",
};

const ICON_NAME_MAP: Record<string, ExpertGlyph> = {
  sparkles: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  globe: { ios: "globe", android: "public", web: "public" },
  "book-open": { ios: "book.fill", android: "menu_book", web: "menu_book" },
  user: { ios: "person.fill", android: "person", web: "person" },
  rocket: { ios: "rocket.fill", android: "rocket_launch", web: "rocket_launch" },
  fingerprint: { ios: "touchid", android: "fingerprint", web: "fingerprint" },
  "file-text": { ios: "doc.text.fill", android: "description", web: "description" },
  video: { ios: "video.fill", android: "videocam", web: "videocam" },
  palette: { ios: "paintpalette.fill", android: "palette", web: "palette" },
  "trending-up": { ios: "chart.line.uptrend.xyaxis", android: "trending_up", web: "trending_up" },
  "pen-tool": { ios: "pencil.tip", android: "edit", web: "edit" },
  "candlestick-chart": { ios: "chart.bar.fill", android: "candlestick_chart", web: "candlestick_chart" },
  home: { ios: "house.fill", android: "home", web: "home" },
  baby: { ios: "figure.and.child.holdinghands", android: "child_care", web: "child_care" },
  "message-square": { ios: "bubble.left.fill", android: "chat_bubble", web: "chat_bubble" },
  cpu: { ios: "cpu", android: "memory", web: "memory" },
  // Dashboard coding-coach template uses "code" (not in Lucide map there → Layers);
  // map it to a terminal/code glyph for mobile.
  code: { ios: "chevron.left.forwardslash.chevron.right", android: "code", web: "code" },
  server: { ios: "server.rack", android: "dns", web: "dns" },
  wrench: { ios: "wrench.fill", android: "build", web: "build" },
  heart: { ios: "heart.fill", android: "favorite", web: "favorite" },
  mail: { ios: "envelope.fill", android: "mail", web: "mail" },
  zap: { ios: "bolt.fill", android: "bolt", web: "bolt" },
  terminal: { ios: "terminal.fill", android: "terminal", web: "terminal" },
  "list-todo": { ios: "checklist", android: "checklist", web: "checklist" },
  presentation: { ios: "rectangle.on.rectangle", android: "slideshow", web: "slideshow" },
  activity: { ios: "waveform.path.ecg", android: "monitor_heart", web: "monitor_heart" },
  "hard-drive": { ios: "externaldrive.fill", android: "hard_drive", web: "hard_drive" },
  "bar-chart-3": { ios: "chart.bar.fill", android: "bar_chart", web: "bar_chart" },
  network: { ios: "network", android: "hub", web: "hub" },
  "shield-check": { ios: "checkmark.shield.fill", android: "verified_user", web: "verified_user" },
  "refresh-cw": { ios: "arrow.triangle.2.circlepath", android: "sync", web: "sync" },
  utensils: { ios: "fork.knife", android: "restaurant", web: "restaurant" },
  bell: { ios: "bell.fill", android: "notifications", web: "notifications" },
  coffee: { ios: "cup.and.saucer.fill", android: "coffee", web: "coffee" },
  "shopping-bag": { ios: "bag.fill", android: "shopping_bag", web: "shopping_bag" },
  layers: DEFAULT_GLYPH,
};

/** Resolve Lucide-style ``icon_name`` to a platform glyph; never returns null. */
export function expertGlyphForName(iconName: string | null | undefined): ExpertGlyph {
  const key = (iconName ?? "").trim().toLowerCase();
  if (!key) {
    return DEFAULT_GLYPH;
  }
  return ICON_NAME_MAP[key] ?? DEFAULT_GLYPH;
}

/** Join API base + relative ``icon_url`` (e.g. ``/api/agents/…/avatar``). */
export function resolveAgentIconUrl(
  baseUrl: string | null | undefined,
  iconUrl: string | null | undefined,
): string | null {
  const raw = (iconUrl ?? "").trim();
  if (!raw) {
    return null;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const base = (baseUrl ?? "").replace(/\/$/, "");
  if (!base) {
    return null;
  }
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}
