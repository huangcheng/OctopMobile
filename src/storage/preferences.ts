import * as SecureStore from "expo-secure-store";

import { PALETTE_KEYS, type PaletteKey } from "../../constants/OctopTheme";
import type { LocalePreference } from "../i18n";
import { STORAGE_KEYS } from "./keys";

const LOCALE_PREFERENCES = new Set<LocalePreference>(["system", "en", "zh"]);
const PALETTE_PREFERENCES = new Set<string>(PALETTE_KEYS);

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("BASE_URL_INVALID");
  }
  // Reject malformed URLs (bad ports, missing host) — a malformed base URL
  // wedges every API call (RN parses it as file:// and never settles).
  try {
    const url = new URL(trimmed);
    if (!url.hostname) {
      throw new Error("BASE_URL_INVALID");
    }
  } catch {
    throw new Error("BASE_URL_INVALID");
  }
  return trimmed;
}

export function toWsBase(baseUrl: string): string {
  if (baseUrl.startsWith("https://")) return "wss://" + baseUrl.slice("https://".length);
  if (baseUrl.startsWith("http://")) return "ws://" + baseUrl.slice("http://".length);
  throw new Error("BASE_URL_INVALID");
}

export async function getBaseUrl(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.baseUrl);
  if (!raw) {
    return null;
  }
  // A stored value that fails validation is treated as absent so the app
  // falls back to login instead of wedging every request on a broken URL.
  try {
    return normalizeBaseUrl(raw);
  } catch {
    return null;
  }
}

export async function setBaseUrl(input: string): Promise<void> {
  const normalized = normalizeBaseUrl(input);
  await SecureStore.setItemAsync(STORAGE_KEYS.baseUrl, normalized);
}

export async function getCleartextWarningAck(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.cleartextAck);
  return value === "1";
}

export async function ackCleartextWarning(): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.cleartextAck, "1");
}

export async function getSelectedAgentId(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.selectedAgentId);
}

export async function setSelectedAgentId(agentId: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.selectedAgentId, agentId);
}

export async function clearSelectedAgentId(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.selectedAgentId);
}

export async function getLocalePreference(): Promise<LocalePreference> {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.localePreference);
  if (value && LOCALE_PREFERENCES.has(value as LocalePreference)) {
    return value as LocalePreference;
  }
  return "system";
}

export async function setLocalePreference(preference: LocalePreference): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.localePreference, preference);
}

/** Brand palette (Octop dashboard `themePalettes`); defaults to the rose constitution. */
export async function getPalettePreference(): Promise<PaletteKey> {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.palette);
  if (value && PALETTE_PREFERENCES.has(value)) {
    return value as PaletteKey;
  }
  return "rose";
}

export async function setPalettePreference(palette: PaletteKey): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.palette, palette);
}

export type ThemeMode = "system" | "light" | "dark";
const THEME_MODES = new Set<string>(["system", "light", "dark"]);

/** In-app color scheme override; default follows the OS. */
export async function getThemeMode(): Promise<ThemeMode> {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.themeMode);
  if (value && THEME_MODES.has(value)) {
    return value as ThemeMode;
  }
  return "system";
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.themeMode, mode);
}
