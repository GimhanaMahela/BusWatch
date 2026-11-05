import type messages from "../../messages/en.json";
import type { Language } from "@/constants/reportConstants";

// Type-checks translation keys and locales: t("submit.title") must exist in messages/en.json.
declare module "next-intl" {
  interface AppConfig {
    Locale: Language;
    Messages: typeof messages;
  }
}
