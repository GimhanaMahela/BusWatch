import type { Locale } from "@/i18n/translate";

// Sinhala and Tamil dates use the Sri Lankan region's conventions
const INTL_LOCALE: Record<Locale, string> = { en: "en-LK", si: "si-LK", ta: "ta-LK" };

export const formatDateTime = (iso: string, locale: Locale): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
