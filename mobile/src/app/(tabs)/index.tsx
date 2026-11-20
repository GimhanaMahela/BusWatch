import { router } from "expo-router";
import * as Linking from "expo-linking";
import { View } from "react-native";

import { WEB_URL } from "@/api/client";
import { AppText, Button, Card, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export default function HomeScreen() {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
        <AppText variant="label" style={{ color: theme.secondary }}>
          {t("home.badge")}
        </AppText>
        <AppText variant="title">
          {t("home.titleStart")}{" "}
          <AppText variant="title" style={{ color: theme.primary }}>
            {t("home.titleHighlight")}
          </AppText>
        </AppText>
        <AppText variant="secondary">{t("home.subtitle")}</AppText>
      </View>

      {/* Phase 2 brings the report form into the app; until then it opens the website's form */}
      <Button
        label={t("home.reportCta")}
        onPress={() => void Linking.openURL(`${WEB_URL}/submit-report`)}
      />
      <AppText variant="secondary">{t("app.reportOnWebsite")}</AppText>

      <Card>
        <AppText variant="heading">{t("home.quickTrackTitle")}</AppText>
        <AppText variant="secondary">{t("home.quickTrackText")}</AppText>
        <Button
          variant="outline"
          label={t("home.trackCta")}
          onPress={() => router.navigate("/track")}
        />
      </Card>
    </Screen>
  );
}
