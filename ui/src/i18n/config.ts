import { LANGUAGES, type Language } from "@/constants/reportConstants";

// The site language lives in a cookie rather than the URL, so existing links (emails, QR stickers,
// bookmarks) keep working in every language.
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const DEFAULT_LOCALE: Language = "en";
export const LOCALES = LANGUAGES.map((l) => l.value) as readonly Language[];

export const isLocale = (value: unknown): value is Language =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/** Picks the best supported language from an Accept-Language header ("si-LK,si;q=0.9,en;q=0.8"). */
export const negotiateLocale = (acceptLanguage: string | null | undefined): Language => {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = Number(
        params
          .find((p) => p.trim().startsWith("q="))
          ?.trim()
          .slice(2) ?? 1,
      );
      return { lang: tag.toLowerCase().split("-")[0], q: Number.isNaN(q) ? 0 : q };
    })
    .filter((entry) => entry.lang && entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.map((entry) => entry.lang).find(isLocale) ?? DEFAULT_LOCALE;
};

/** Remembers the passenger's choice for a year. */
export const writeLocaleCookie = (locale: Language) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
};
