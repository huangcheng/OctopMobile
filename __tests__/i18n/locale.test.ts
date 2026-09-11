import { describe, expect, jest, test } from "@jest/globals";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

import {
  localeFromUserLocale,
  resolveLocale,
  translate,
} from "../../src/i18n";

describe("resolveLocale", () => {
  test("system follows device (mocked en)", () => {
    expect(resolveLocale("system")).toBe("en");
  });

  test("explicit preference wins", () => {
    expect(resolveLocale("zh")).toBe("zh");
    expect(resolveLocale("en")).toBe("en");
  });
});

describe("localeFromUserLocale", () => {
  test("maps Octop zh-CN to zh", () => {
    expect(localeFromUserLocale("zh-CN")).toBe("zh");
  });

  test("maps en-US to en", () => {
    expect(localeFromUserLocale("en-US")).toBe("en");
  });

  test("returns null for empty", () => {
    expect(localeFromUserLocale(null)).toBeNull();
  });
});

describe("translate", () => {
  test("returns zh string for zh locale", () => {
    expect(translate("zh", "login.title")).toBe("登录");
  });

  test("falls back to en for missing keys via en dict completeness", () => {
    expect(translate("en", "settings.language")).toBe("Language");
  });
});
