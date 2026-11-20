import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FollowReport } from "@/components/FollowReport";
import { AppText, Button, Card, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { gradients, radiusLarge, spacing } from "@/theme/colors";

function Banner({
  colors,
  icon,
  title,
}: {
  colors: readonly [string, string, ...string[]];
  icon: "checkmark" | "cloud-offline";
  title: string;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={styles.bannerIcon}>
        <Ionicons name={icon} size={40} color="#FFFFFF" />
      </View>
      <Text style={styles.bannerTitle}>{title}</Text>
    </LinearGradient>
  );
}

export default function ReportSentScreen() {
  const { t } = useI18n();
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
        <Banner colors={gradients.sunrise} icon="cloud-offline" title={t("offline.queuedTitle")} />
        <Card>
          <AppText>{t("offline.queuedText")}</AppText>
          <AppText variant="secondary">{t("offline.queuedHint")}</AppText>
        </Card>
        <Button icon="home" label={t("header.home")} onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  const copy = async () => {
    await Clipboard.setStringAsync(receiptId);
    setCopied(true);
  };

  return (
    <Screen>
      <Banner colors={gradients.success} icon="checkmark" title={t("success.title")} />
      <Card style={styles.ticket}>
        <AppText variant="label" style={{ textAlign: "center" }}>
          {t("track.receiptId")}
        </AppText>
        <AppText variant="title" style={styles.receipt} selectable>
          {receiptId}
        </AppText>
        <AppText variant="secondary" style={{ textAlign: "center" }}>
          {t("success.saveId")}
        </AppText>
        <Button
          variant="outline"
          icon={copied ? "checkmark-done" : "copy-outline"}
          label={copied ? t("common.copied") : t("success.copyId")}
          onPress={() => void copy()}
        />
        {emailed ? <AppText variant="secondary">✉️ {t("success.emailed")}</AppText> : null}
        {texted ? <AppText variant="secondary">💬 {t("success.texted")}</AppText> : null}
      </Card>
      <FollowReport receiptId={receiptId} />
      <View style={{ gap: spacing.sm }}>
        <Button
          icon="pulse"
          label={t("success.track")}
          onPress={() => router.replace({ pathname: "/track/[receiptId]", params: { receiptId } })}
        />
        <Button
          variant="outline"
          icon="add-circle-outline"
          label={t("success.another")}
          onPress={() => router.replace("/report")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radiusLarge + 6,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  bannerIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 30,
  },
  ticket: { borderStyle: "dashed", borderWidth: 2 },
  receipt: { textAlign: "center", letterSpacing: 2, fontSize: 30 },
});
