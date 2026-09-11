import { useSyncExternalStore } from "react";

import type { PaletteKey } from "@/constants/OctopTheme";
import { getPalettePreference, setPalettePreference } from "@/src/storage/preferences";

/**
 * In-memory brand palette with SecureStore persistence (mirrors the Octop
 * dashboard palette picker). `useOctopTheme` subscribes so every screen
 * re-renders on change without a restart.
 */
let current: PaletteKey = "rose";
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function getCurrentPalette(): PaletteKey {
  return current;
}

export function subscribePalette(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Load the stored palette once at app start (call from the root layout). */
export async function initPalette(): Promise<void> {
  if (loaded) {
    return;
  }
  loaded = true;
  current = await getPalettePreference();
  emit();
}

export async function selectPalette(palette: PaletteKey): Promise<void> {
  if (palette === current) {
    return;
  }
  current = palette;
  emit();
  await setPalettePreference(palette);
}

export function usePalette(): PaletteKey {
  return useSyncExternalStore(subscribePalette, getCurrentPalette, getCurrentPalette);
}
