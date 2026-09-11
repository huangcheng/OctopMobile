import { describe, expect, jest, test } from "@jest/globals";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { normalizeBaseUrl, toWsBase } from "../../src/storage/preferences";

describe("normalizeBaseUrl", () => {
  test("trims and strips trailing slashes", () => {
    expect(normalizeBaseUrl("  https://octop.example/  ")).toBe("https://octop.example");
  });

  test("accepts http and https", () => {
    expect(normalizeBaseUrl("http://192.168.1.5:8000")).toBe("http://192.168.1.5:8000");
  });

  test("throws BASE_URL_INVALID for missing scheme", () => {
    expect(() => normalizeBaseUrl("octop.example")).toThrow("BASE_URL_INVALID");
  });
});

describe("toWsBase", () => {
  test("maps https to wss", () => {
    expect(toWsBase("https://octop.example")).toBe("wss://octop.example");
  });

  test("maps http to ws", () => {
    expect(toWsBase("http://192.168.1.5:8000")).toBe("ws://192.168.1.5:8000");
  });

  test("throws BASE_URL_INVALID for invalid scheme", () => {
    expect(() => toWsBase("ftp://example.com")).toThrow("BASE_URL_INVALID");
  });
});
