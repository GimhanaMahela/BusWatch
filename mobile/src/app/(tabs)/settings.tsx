import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { API_URL } from "@/api/client";
import { AppText, Card, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/translate";
import { accents, radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

// Each language gets its own colour and its own script as a monogram
const LANGUAGE_LOOK: Record<Locale, { color: string; mark: string }> = {
  en: { color: accents.blue, mark: "Aa" },
  si: { color: accents.orange, mark: "අ" },
  ta: { color: accents.violet, mark: "அ" },
};

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();

  return (
    <Screen>
      <Card>
        <SectionTitle icon="language" color={accents.violet}>
          {t("common.language")}
        </SectionTitle>
        <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
          {LOCALES.map((option) => {
            const selected = option === locale;
            const look = LANGUAGE_LOOK[option];
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={LOCALE_NAMES[option]}
                onPress={() => setLocale(option)}
                style={[
                  styles.option,
                  {
                    borderColor: selected ? look.color : theme.divider,
                    backgroundColor: selected ? `${look.color}14` : theme.surface,
                  },
                ]}
              >
                <View style={[styles.mark, { backgroundColor: look.color }]}>
                  <Text style={styles.markText}>{look.mark}</Text>
                </View>
                <AppText style={{ flex: 1, fontWeight: selected ? "700" : "500" }}>
                  {LOCALE_NAMES[option]}
                </AppText>
                {selected && <Ionicons name="checkmark-circle" size={24} color={look.color} />}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={styles.about}>
        <AppText style={[styles.brand, { color: theme.primary }]}>TransitX</AppText>
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
    minHeight: 60,
    borderRadius: radius,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  mark: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  markText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  about: { alignItems: "center", gap: 2, paddingTop: spacing.md },
  brand: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
});
