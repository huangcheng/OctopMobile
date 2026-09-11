import { describe, expect, it } from "@jest/globals";
import {
  cronStatusLabel,
  formatTrigger,
} from "@/src/utils/schedule";

describe("formatTrigger", () => {
  it("humanizes a daily cron", () => {
    expect(formatTrigger("cron:30 8 * * *", "en")).toBe("Daily 8:30 AM");
    expect(formatTrigger("cron:30 8 * * *", "zh")).toBe("每天 8:30");
  });

  it("handles a bare 5-field cron (9:00 → no leading zero in 12h clock)", () => {
    expect(formatTrigger("0 9 * * *", "en")).toBe("Daily 9:00 AM");
  });

  it("humanizes weekday schedules", () => {
    expect(formatTrigger("cron:0 9 * * 1-5", "en")).toBe("Weekdays 9:00 AM");
    expect(formatTrigger("cron:0 9 * * 1-5", "zh")).toBe("工作日 9:00");
  });

  it("humanizes a single weekday with time", () => {
    expect(formatTrigger("cron:0 10 * * 1", "en")).toBe("Mon 10:00 AM");
  });

  it("humanizes interval aliases", () => {
    expect(formatTrigger("interval:2", "en")).toBe("Every 2h");
    expect(formatTrigger("interval:3", "zh")).toBe("每 3 小时");
  });

  it("falls back to the raw spec for unknown shapes", () => {
    expect(formatTrigger("weird", "en")).toBe("weird");
    expect(formatTrigger("", "en")).toBe("—");
  });

  it("formats one-off date triggers", () => {
    const label = formatTrigger("date:2026-09-11T09:30:00Z", "en");
    // ICU may order as "11 Sept" or "Sep 11" and abbreviate Sept/Sep.
    expect(label).toMatch(/11/);
    expect(label).toMatch(/Sep/);
  });
});

describe("cronStatusLabel", () => {
  it("maps ok/success to ok", () => {
    expect(cronStatusLabel("ok")).toBe("ok");
    expect(cronStatusLabel("SUCCESS")).toBe("ok");
  });

  it("maps anything non-empty and non-ok to error", () => {
    expect(cronStatusLabel("error")).toBe("error");
    expect(cronStatusLabel("failed")).toBe("error");
  });

  it("treats missing status as pending", () => {
    expect(cronStatusLabel(null)).toBe("pending");
    expect(cronStatusLabel(undefined)).toBe("pending");
  });
});
