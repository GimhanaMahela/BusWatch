// The website's typefaces: Plus Jakarta Sans, with Noto Sans Sinhala and Noto Sans Tamil for those
// languages (both include Latin, so receipt IDs and numbers match the surrounding text).
// React Native picks a custom font by family name, not by fontWeight, so each weight is its own
// family; fontFor() turns a weight into the right family for the app's language.
import {
  NotoSansSinhala_400Regular,
  NotoSansSinhala_600SemiBold,
  NotoSansSinhala_700Bold,
  NotoSansSinhala_800ExtraBold,
} from "@expo-google-fonts/noto-sans-sinhala";
import {
  NotoSansTamil_400Regular,
  NotoSansTamil_600SemiBold,
  NotoSansTamil_700Bold,
  NotoSansTamil_800ExtraBold,
} from "@expo-google-fonts/noto-sans-tamil";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import type { TextStyle } from "react-native";

import type { Locale } from "@/i18n/translate";

/** Everything useFonts() loads at start-up (all languages, so switching is instant) */
export const FONT_FILES = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  NotoSansSinhala_400Regular,
  NotoSansSinhala_600SemiBold,
  NotoSansSinhala_700Bold,
  NotoSansSinhala_800ExtraBold,
  NotoSansTamil_400Regular,
  NotoSansTamil_600SemiBold,
  NotoSansTamil_700Bold,
  NotoSansTamil_800ExtraBold,
};

const FAMILY: Record<Locale, string> = {
  en: "PlusJakartaSans",
  si: "NotoSansSinhala",
  ta: "NotoSansTamil",
};

type Step = "400Regular" | "600SemiBold" | "700Bold" | "800ExtraBold";

const step = (weight: TextStyle["fontWeight"]): Step => {
  const value =
    weight === "bold" ? 700 : weight === "normal" || weight === undefined ? 400 : Number(weight);
  if (value >= 800) return "800ExtraBold";
  if (value >= 700) return "700Bold";
  if (value >= 500) return "600SemiBold";
  return "400Regular";
};

/** The font family for a weight in the given language */
export const fontFor = (weight: TextStyle["fontWeight"], locale: Locale): string =>
  `${FAMILY[locale]}_${step(weight)}`;
