import { describe, expect, it } from "@jest/globals";
import {
  formatRelativeTime,
  greetingKeyFor,
  hostOfBaseUrl,
  timeGroupOf,
} from "@/src/utils/time";

const NOW = new Date("2026-09-11T14:00:00");

describe("timeGroupOf", () => {
  it("groups today and earlier", () => {
    expect(timeGroupOf("2026-09-11T08:30:00", NOW)).toBe("today");
    expect(timeGroupOf("2026-09-10T23:59:00", NOW)).toBe("earlier");
  });

  it("pushes invalid dates to earlier", () => {
    expect(timeGroupOf("not-a-date", NOW)).toBe("earlier");
  });
});

describe("formatRelativeTime", () => {
  it("shows minutes/hours today, then clock time", () => {
    expect(formatRelativeTime("2026-09-11T13:45:00", "en", NOW)).toBe("15m ago");
    expect(formatRelativeTime("2026-09-11T11:00:00", "en", NOW)).toBe("3h ago");
    expect(formatRelativeTime("2026-09-11T08:30:00", "en", NOW)).toBe("8:30 AM");
  });

  it("localizes to zh", () => {
    expect(formatRelativeTime("2026-09-11T13:45:00", "zh", NOW)).toBe("15分钟前");
    expect(formatRelativeTime("2026-09-11T11:00:00", "zh", NOW)).toBe("3小时前");
  });

  it("shows yesterday and weekday labels", () => {
    expect(formatRelativeTime("2026-09-10T10:00:00", "en", NOW)).toBe("Yesterday");
    expect(formatRelativeTime("2026-09-10T10:00:00", "zh", NOW)).toBe("昨天");
    // Sep 11 2026 is a Friday; Sep 8 is Tuesday.
    expect(formatRelativeTime("2026-09-08T10:00:00", "en", NOW)).toBe("Tue");
  });

  it("shows month/day beyond a week", () => {
    expect(formatRelativeTime("2026-08-20T10:00:00", "en", NOW)).toBe("20 Aug");
  });
});

describe("greetingKeyFor", () => {
  it("picks morning/afternoon/evening by hour", () => {
    expect(greetingKeyFor(new Date("2026-09-11T08:00:00"))).toBe("morning");
    expect(greetingKeyFor(new Date("2026-09-11T14:00:00"))).toBe("afternoon");
    expect(greetingKeyFor(new Date("2026-09-11T21:00:00"))).toBe("evening");
  });
});

describe("hostOfBaseUrl", () => {
  it("strips scheme and trailing slashes", () => {
    expect(hostOfBaseUrl("https://octop.local")).toBe("octop.local");
    expect(hostOfBaseUrl("http://192.168.1.5:8080/")).toBe("192.168.1.5:8080");
    expect(hostOfBaseUrl(null)).toBe("—");
  });
});
