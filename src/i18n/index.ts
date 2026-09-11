import * as Localization from "expo-localization";
import { en } from "./en";
import { zh } from "./zh";

const messages: Record<"en" | "zh", Record<string, string>> = { en, zh };

function getLocale(): "en" | "zh" {
  const languageCode = Localization.getLocales()[0]?.languageCode ?? "en";
  return languageCode.startsWith("zh") ? "zh" : "en";
}

export function t(key: string): string {
  const locale = getLocale();
  const dict = messages[locale];
  return dict[key] ?? messages.en[key] ?? key;
}
