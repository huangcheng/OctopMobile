import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "./keys";

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
