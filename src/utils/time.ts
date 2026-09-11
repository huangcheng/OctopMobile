import type { AppLocale } from "@/src/i18n";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Design 03: threads group into "TODAY" / "EARLIER" sections by last activity. */
export type TimeGroup = "today" | "earlier";

export function timeGroupOf(iso: string, now: Date = new Date()): TimeGroup {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "earlier";
  }
  return date.getTime() >= startOfDay(now).getTime() ? "today" : "earlier";
}

function weekdayLabel(date: Date, locale: AppLocale): string {
  // en-GB gives "Mon"; zh gives "周一"
  const tag = locale === "zh" ? "zh-CN" : "en-GB";
  const label = date.toLocaleDateString(tag, { weekday: "short" });
  return label.replace(/周/, "周");
}

/**
 * Compact relative time used in list meta rows (design: "2h ago", "8:30 AM", "Yesterday", "Mon").
 * Returns a locale-aware string without depending on Intl.RelativeTimeFormat coverage.
 */
export function formatRelativeTime(iso: string, locale: AppLocale, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const diff = now.getTime() - date.getTime();
  if (diff < 0) {
    return formatClock(date, locale);
  }

  if (isSameDay(date, now)) {
    if (diff < HOUR) {
      const minutes = Math.max(1, Math.floor(diff / MINUTE));
      return locale === "zh" ? `${minutes}分钟前` : `${minutes}m ago`;
    }
    // Include the 3h boundary so "3h ago" stays relative; older today → clock.
    if (diff <= 3 * HOUR) {
      const hours = Math.max(1, Math.floor(diff / HOUR));
      return locale === "zh" ? `${hours}小时前` : `${hours}h ago`;
    }
    return formatClock(date, locale);
  }

  const yesterday = new Date(now.getTime() - DAY);
  if (isSameDay(date, yesterday)) {
    return locale === "zh" ? "昨天" : "Yesterday";
  }

  if (diff < 7 * DAY) {
    return weekdayLabel(date, locale);
  }

  const tag = locale === "zh" ? "zh-CN" : "en-GB";
  return date.toLocaleDateString(tag, { month: "short", day: "numeric" });
}

export function formatClock(date: Date, locale: AppLocale): string {
  const tag = locale === "zh" ? "zh-CN" : "en-US";
  if (locale === "zh") {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  return date
    .toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })
    .replace(/\s?([AP])M/i, (_m, p1: string) => ` ${p1.toUpperCase()}M`);
}

/** Design 03 greeting card: "Good morning, huangcheng". */
export function greetingKeyFor(now: Date = new Date()): "morning" | "afternoon" | "evening" {
  const hour = now.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** Host part of a normalized base URL ("https://octop.local" → "octop.local"). */
export function hostOfBaseUrl(baseUrl: string | null): string {
  if (!baseUrl) {
    return "—";
  }
  try {
    return baseUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  } catch {
    return baseUrl;
  }
}
