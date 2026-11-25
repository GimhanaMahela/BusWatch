import { IntlMessageFormat } from "intl-messageformat";

import webEn from "../../../ui/messages/en.json";
import webSi from "../../../ui/messages/si.json";
import webTa from "../../../ui/messages/ta.json";
import appEn from "../messages/en.json";
import appSi from "../messages/si.json";
import appTa from "../messages/ta.json";

export const LOCALES = ["en", "si", "ta"] as const;
export type Locale = (typeof LOCALES)[number];

/** Each language's own name, for the language picker */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", si: "සිංහල", ta: "தமிழ்" };

type Messages = { [key: string]: string | Messages };

// The website's text (shared, same ICU syntax as next-intl) plus the app's own few strings
const catalogues: Record<Locale, Messages> = {
  en: { ...webEn, app: appEn },
  si: { ...webSi, app: appSi },
  ta: { ...webTa, app: appTa },
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

const lookup = (messages: Messages, key: string): string | undefined => {
  let node: string | Messages | undefined = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
};

/** Arguments, or tag functions for rich text such as "agree to our <terms>terms</terms>" */
export type Values = Record<string, string | number | ((chunks: string[]) => string)>;
export type Translate = (key: string, values?: Values) => string;

/**
 * Translator for one language. Falls back to English for a missing key, and to the key itself
 * when English lacks it too, so a gap shows up in testing instead of crashing.
 */
export const createTranslator = (locale: Locale): Translate => {
  const cache = new Map<string, IntlMessageFormat>();
  return (key, values) => {
    const source = lookup(catalogues[locale], key) ?? lookup(catalogues.en, key);
    if (source === undefined) return key;
    let format = cache.get(key);
    if (!format) {
      format = new IntlMessageFormat(source, locale);
      cache.set(key, format);
    }
    const result = format.format<string>(values);
    return Array.isArray(result) ? result.join("") : String(result);
  };
};
