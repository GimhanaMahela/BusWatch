import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import type { Language } from "@/constants/reportConstants";
import en from "../../messages/en.json";
import { isLocale, LOCALE_COOKIE, negotiateLocale } from "./config";

type Messages = { [key: string]: string | Messages };

/** English underneath the chosen language, so a missing translation shows English, not a key. */
const withFallback = (base: Messages, override: Messages): Messages => {
  const merged: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const fallback = base[key];
    merged[key] =
      typeof value === "object" && typeof fallback === "object"
        ? withFallback(fallback, value)
        : value;
  }
  return merged;
};

const loadMessages = async (locale: Language): Promise<Messages> =>
  locale === "en"
    ? en
    : withFallback(en, (await import(`../../messages/${locale}.json`)).default as Messages);

// next-intl calls this for every server render: the cookie wins, then the browser's languages.
export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved)
    ? saved
    : negotiateLocale((await headers()).get("accept-language"));

  return { locale, messages: await loadMessages(locale), timeZone: "Asia/Colombo" };
});
