import type { AppLocale } from "@/src/i18n";

/**
 * Humanize Octop cron trigger specs for the Automation tab (design 13).
 * Trigger language at the pin: `cron:<5-field>`, bare 5-field cron,
 * `interval:<N>` (hours) and `date:<ISO8601>` aliases.
 */

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function parseClock(hhmm: string): { h: number; m: number } | null {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return { h, m };
}

function clockLabel(h: number, m: number, locale: AppLocale): string {
  if (locale === "zh") {
    return `${h}:${m.toString().padStart(2, "0")}`;
  }
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function cronField(value: string): string[] {
  return value.trim().split(/\s+/);
}

/**
 * Best-effort human summary of a trigger. Falls back to the raw spec —
 * the design favors readable schedules ("Daily 8:30 AM") but never lies.
 */
export function formatTrigger(trigger: string, locale: AppLocale): string {
  const raw = (trigger ?? "").trim();
  if (!raw) {
    return "—";
  }

  if (raw.startsWith("interval:")) {
    const hours = Number(raw.slice("interval:".length).trim());
    if (Number.isFinite(hours) && hours > 0) {
      if (Number.isInteger(hours)) {
        return locale === "zh" ? `每 ${hours} 小时` : `Every ${hours}h`;
      }
      return locale === "zh" ? `每 ${hours} 小时` : `Every ${hours}h`;
    }
    return raw;
  }

  if (raw.startsWith("date:")) {
    const date = new Date(raw.slice("date:".length).trim());
    if (!Number.isNaN(date.getTime())) {
      const tag = locale === "zh" ? "zh-CN" : "en-GB";
      return date.toLocaleDateString(tag, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return raw;
  }

  const body = raw.startsWith("cron:") ? raw.slice("cron:".length).trim() : raw;
  const fields = cronField(body);
  if (fields.length !== 5) {
    return raw;
  }
  const [minuteF, hourF, dayOfMonthF, , weekdayF] = fields;
  const zh = locale === "zh";

  const everyTime = minuteF === "*" && hourF === "*";
  const dailyAt = minuteF !== "*" && hourF !== "*" && dayOfMonthF === "*" && weekdayF === "*";
  const hourlyAt = hourF === "*" && minuteF !== "*" && dayOfMonthF === "*";
  const weekdays = weekdayF.startsWith("1-5") && dayOfMonthF === "*";
  const singleWeekday = /^\d$/.test(weekdayF) && dayOfMonthF === "*";

  if (everyTime) {
    return zh ? "每分钟" : "Every minute";
  }

  if (dailyAt) {
    const clock = parseClock(`${hourF}:${minuteF}`);
    if (clock) {
      return zh ? `每天 ${clockLabel(clock.h, clock.m, locale)}` : `Daily ${clockLabel(clock.h, clock.m, locale)}`;
    }
  }

  if (hourlyAt && minuteF !== "*") {
    const m = Number(minuteF);
    if (Number.isInteger(m)) {
      return zh ? `每小时 :${m.toString().padStart(2, "0")}` : `Hourly :${m.toString().padStart(2, "0")}`;
    }
  }

  if (weekdays) {
    const clock = parseClock(`${hourF}:${minuteF}`);
    const time = clock ? ` ${clockLabel(clock.h, clock.m, locale)}` : "";
    return zh ? `工作日${time}` : `Weekdays${time ? ` ${clockLabel(clock!.h, clock!.m, locale)}` : ""}`;
  }

  if (singleWeekday) {
    const day = Number(weekdayF);
    const clock = parseClock(`${hourF}:${minuteF}`);
    const dayLabel = zh ? WEEKDAYS_ZH[day] ?? WEEKDAYS_ZH[0] : WEEKDAYS_EN[day] ?? WEEKDAYS_EN[0];
    const time = clock ? ` ${clockLabel(clock.h, clock.m, locale)}` : "";
    return `${dayLabel}${time}`;
  }

  return raw;
}

/** Status pill label for a cron row: OK when last run succeeded, Error otherwise (design 13). */
export function cronStatusLabel(status: string | null | undefined): "ok" | "error" | "pending" {
  const value = (status ?? "").toLowerCase();
  if (!value) {
    return "pending";
  }
  if (value === "ok" || value === "success" || value === "succeeded") {
    return "ok";
  }
  return "error";
}
