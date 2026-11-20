import Constants from "expo-constants";
import { Pressable, StyleSheet, View } from "react-native";

import { API_URL } from "@/api/client";
import { AppText, Card, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_NAMES, LOCALES } from "@/i18n/translate";
import { radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();

  return (
    <Screen>
      <Card>
        <AppText variant="heading">{t("common.language")}</AppText>
        <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
          {LOCALES.map((option) => {
            const selected = option === locale;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setLocale(option)}
                style={[
                  styles.option,
                  {
                    borderColor: selected ? theme.primary : theme.divider,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                <AppText style={selected ? { color: theme.primary, fontWeight: "600" } : null}>
                  {LOCALE_NAMES[option]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="secondary">
          {t("app.version", { version: Constants.expoConfig?.version ?? "?" })}
        </AppText>
        {__DEV__ && (
          <AppText variant="secondary">
            {t("app.apiServer")}: {API_URL}
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 48,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
});
