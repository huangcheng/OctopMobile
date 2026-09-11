import * as SecureStore from "expo-secure-store";

import type { LocalePreference } from "../i18n";
import { STORAGE_KEYS } from "./keys";

const LOCALE_PREFERENCES = new Set<LocalePreference>(["system", "en", "zh"]);

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
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
  return SecureStore.getItemAsync(STORAGE_KEYS.baseUrl);
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
