import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Image, StyleSheet, View } from "react-native";

import { API_URL, WEB_URL } from "@/api/client";
import { PressableScale, Rise } from "@/components/motion";
import { Text } from "@/components/Text";
import { AppText, Card, ListRow, PageHeader, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/translate";
import { accents, gradients, radius, radiusLarge, spacing } from "@/theme/colors";
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
  const open = (path: string) => void Linking.openURL(`${WEB_URL}${path}`);

  return (
    <Screen tab>
      <Rise index={0}>
        <PageHeader title={t("app.settings")} />
      </Rise>

      <Rise index={1}>
        <LinearGradient
          colors={gradients.deep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brand}
        >
          <View style={styles.brandLogo}>
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.brandName}>
              Transit<Text style={[styles.brandName, { color: "#FF8A3D" }]}>X</Text>
            </Text>
            <Text style={styles.brandText} numberOfLines={2}>
              {t("footer.madeFor")}
            </Text>
          </View>
        </LinearGradient>
      </Rise>

      <Rise index={2}>
        <Card>
          <AppText variant="label">{t("common.language")}</AppText>
          <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
            {LOCALES.map((option) => {
              const selected = option === locale;
              const look = LANGUAGE_LOOK[option];
              return (
                <PressableScale
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={LOCALE_NAMES[option]}
                  haptics="selection"
                  scaleTo={0.98}
                  onPress={() => setLocale(option)}
                  style={[
                    styles.option,
                    {
                      borderColor: selected ? look.color : theme.divider,
                      backgroundColor: selected ? `${look.color}12` : theme.surface,
                    },
                  ]}
                >
                  <View style={[styles.mark, { backgroundColor: look.color }]}>
                    <Text style={styles.markText}>{look.mark}</Text>
                  </View>
                  <AppText style={{ flex: 1, fontWeight: selected ? "700" : "500" }}>
                    {LOCALE_NAMES[option]}
                  </AppText>
                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={selected ? look.color : theme.divider}
                  />
                </PressableScale>
              );
            })}
          </View>
        </Card>
      </Rise>

      <Rise index={3}>
        <Card style={{ gap: 0 }}>
          <ListRow
            icon="sparkles"
            color={accents.orange}
            title={t("app.replayIntro")}
            onPress={() => router.push("/welcome")}
          />
          <ListRow
            icon="stats-chart"
            color={accents.blue}
            title={t("footer.impact")}
            onPress={() => router.push("/impact")}
          />
          <ListRow
            icon="information-circle"
            color={accents.teal}
            title={t("footer.about")}
            onPress={() => open("/about-us")}
          />
          <ListRow
            icon="lock-closed"
            color={accents.violet}
            title={t("footer.privacy")}
            onPress={() => open("/privacy-policy")}
          />
          <ListRow
            icon="document-text"
            color={accents.slate}
            title={t("footer.terms")}
            onPress={() => open("/terms-of-service")}
          />
        </Card>
      </Rise>

      <View style={styles.about}>
        <AppText variant="secondary" style={{ fontSize: 13 }}>
          {t("app.version", { version: Constants.expoConfig?.version ?? "?" })}
        </AppText>
        {__DEV__ && (
          <AppText variant="secondary" style={{ fontSize: 12 }}>
            {t("app.apiServer")}: {API_URL}
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radiusLarge + 4,
    padding: spacing.md + 2,
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 52, height: 38 },
  brandName: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  brandText: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18 },
  option: {
    minHeight: 62,
    borderRadius: radius + 2,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  mark: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  markText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  about: { alignItems: "center", gap: 2, paddingTop: spacing.sm },
});
