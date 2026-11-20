import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export default function ReportSentScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const {
    receiptId = "",
    emailed,
    texted,
    queued,
  } = useLocalSearchParams<{
    receiptId?: string;
    emailed?: string;
    texted?: string;
    queued?: string;
  }>();
  const [copied, setCopied] = useState(false);

  // Saved offline: there is no receipt ID until the outbox sends it
  if (queued) {
    return (
      <Screen>
        <AppText variant="title" style={{ color: theme.warning }}>
          {t("offline.queuedTitle")}
        </AppText>
        <Card>
          <AppText>{t("offline.queuedText")}</AppText>
          <AppText variant="secondary">{t("offline.queuedHint")}</AppText>
        </Card>
        <Button label={t("header.home")} onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  const copy = async () => {
    await Clipboard.setStringAsync(receiptId);
    setCopied(true);
  };

  return (
    <Screen>
      <AppText variant="title" style={{ color: theme.success }}>
        {t("success.title")}
      </AppText>
      <Card>
        <AppText variant="secondary">{t("success.saveId")}</AppText>
        <AppText variant="label">{t("track.receiptId")}</AppText>
        <AppText variant="title" style={{ letterSpacing: 1 }} selectable>
          {receiptId}
        </AppText>
        <Button
          variant="outline"
          label={copied ? t("common.copied") : t("success.copyId")}
          onPress={() => void copy()}
        />
        {emailed ? <AppText variant="secondary">{t("success.emailed")}</AppText> : null}
        {texted ? <AppText variant="secondary">{t("success.texted")}</AppText> : null}
      </Card>
      <View style={{ gap: spacing.sm }}>
        <Button
          label={t("success.track")}
          onPress={() => router.replace({ pathname: "/track/[receiptId]", params: { receiptId } })}
        />
        <Button
          variant="outline"
          label={t("success.another")}
          onPress={() => router.replace("/report")}
        />
      </View>
    </Screen>
  );
}
