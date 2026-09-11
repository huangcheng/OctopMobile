import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type AppLocale,
  type LocalePreference,
  type MessageKey,
  type TranslateParams,
  resolveLocale,
  setActiveLocale,
  translate,
} from "./index";
import {
  getLocalePreference,
  setLocalePreference as persistLocalePreference,
} from "../storage/preferences";

type I18nContextValue = {
  preference: LocalePreference;
  locale: AppLocale;
  t: (key: MessageKey, params?: TranslateParams) => string;
  setPreference: (preference: LocalePreference) => Promise<void>;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getLocalePreference();
      if (cancelled) {
        return;
      }
      setActiveLocale(resolveLocale(stored));
      setPreferenceState(stored);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(async (next: LocalePreference) => {
    await persistLocalePreference(next);
    setActiveLocale(resolveLocale(next));
    setPreferenceState(next);
  }, []);

  const locale = resolveLocale(preference);

  useEffect(() => {
    setActiveLocale(locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      preference,
      locale,
      ready,
      t: (key: MessageKey, params?: TranslateParams) => translate(locale, key, params),
      setPreference,
    }),
    [preference, locale, ready, setPreference],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
