import * as Localization from "expo-localization";

import { en } from "./en";
import { zh } from "./zh";

export type AppLocale = "en" | "zh";
export type LocalePreference = "system" | AppLocale;
export type MessageKey = keyof typeof en;

const messages: Record<AppLocale, Record<MessageKey, string>> = { en, zh };

let activeLocale: AppLocale = resolveLocale("system");

export function deviceLocale(): AppLocale {
  const languageCode = Localization.getLocales()[0]?.languageCode ?? "en";
  return languageCode.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** Resolve UI locale the same way Octop dashboard does: zh* → zh, else en. */
export function resolveLocale(preference: LocalePreference): AppLocale {
  if (preference === "system") {
    return deviceLocale();
  }
  return preference;
}

/** Map Octop user.locale (e.g. zh-CN) to app locale. */
export function localeFromUserLocale(userLocale: string | null | undefined): AppLocale | null {
  if (!userLocale) {
    return null;
  }
  return userLocale.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export type TranslateParams = Record<string, string | number>;

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

export function translate(locale: AppLocale, key: MessageKey, params?: TranslateParams): string {
  const template = messages[locale][key] ?? messages.en[key] ?? key;
  return interpolate(template, params);
}

export function getActiveLocale(): AppLocale {
  return activeLocale;
}

export function setActiveLocale(locale: AppLocale): void {
  activeLocale = locale;
}

/** Translate using the active locale (safe outside React). UI should prefer useI18n(). */
export function t(key: MessageKey): string {
  return translate(activeLocale, key);
}
