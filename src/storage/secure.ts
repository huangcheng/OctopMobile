import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "./keys";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
}
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, token);
}
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
}
