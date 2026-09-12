import { useSyncExternalStore } from "react";

import { getThemeMode, setThemeMode, type ThemeMode } from "@/src/storage/preferences";

/**
 * In-app color scheme override (Settings ▸ Appearance), persisted in
 * SecureStore. `useThemeMode` subscribes so every `useOctopTheme` consumer
 * re-renders on change without a restart.
 */
let current: ThemeMode = "system";
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function getCurrentThemeMode(): ThemeMode {
  return current;
}

export function subscribeThemeMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Load the stored mode once at app start (call from the root layout). */
export async function initThemeMode(): Promise<void> {
  if (loaded) {
    return;
  }
  loaded = true;
  current = await getThemeMode();
  emit();
}

export async function selectThemeMode(mode: ThemeMode): Promise<void> {
  if (mode === current) {
    return;
  }
  current = mode;
  emit();
  await setThemeMode(mode);
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeThemeMode, getCurrentThemeMode, getCurrentThemeMode);
}

/** Resolve the effective scheme: explicit override wins, else the OS value. */
export function resolveScheme(mode: ThemeMode, osScheme: string | null | undefined): "light" | "dark" {
  if (mode === "light" || mode === "dark") {
    return mode;
  }
  return osScheme === "dark" ? "dark" : "light";
}
