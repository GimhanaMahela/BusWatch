// Text and TextInput in the app's typeface. Use these instead of React Native's: they turn the
// style's fontWeight into the matching font family for the current language.
import type { ComponentProps } from "react";
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from "react-native";

import { useI18n } from "@/i18n/I18nProvider";
import { fontFor } from "@/theme/typography";

const useFontStyle = (style: TextProps["style"]): TextStyle[] => {
  const { locale } = useI18n();
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, ...rest } = flat;
  // Custom fonts carry their own weight; a fontWeight on top would make Android fake-bold them
  return [rest, { fontFamily: fontFor(fontWeight, locale) }];
};

export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={useFontStyle(style)} />;
}

// React 19 passes `ref` through as an ordinary prop
export function TextInput({ style, ...props }: ComponentProps<typeof NativeTextInput>) {
  return <NativeTextInput {...props} style={useFontStyle(style)} />;
}
