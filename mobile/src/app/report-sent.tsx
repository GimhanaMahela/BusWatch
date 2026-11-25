import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";

import { Celebration } from "@/components/Celebration";
import { FollowReport } from "@/components/FollowReport";
import { haptic, PressableScale, Rise } from "@/components/motion";
import { Text } from "@/components/Text";
import { AppText, Button, Card, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { accents, gradients, radiusLarge, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const TITLE: Record<string, string> = {
  commendation: "success.commendTitle",
  lost_item: "success.lostTitle",
};
const TEXT: Record<string, string> = {
  commendation: "success.commendText",
  lost_item: "success.lostText",
};
const ANOTHER: Record<string, string> = {
  commendation: "success.anotherCommendation",
  lost_item: "success.anotherLost",
};

export default function ReportSentScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const {
    receiptId = "",
    emailed,
    texted,
    queued,
    type = "complaint",
  } = useLocalSearchParams<{
    type?: string;
    receiptId?: string;
    emailed?: string;
    texted?: string;
    queued?: string;
  }>();
  const [copied, setCopied] = useState(false);

  // Saved offline: there is no receipt ID until the outbox sends it
  if (queued) {
    return (
      <Screen fullscreen>
        <View style={styles.center}>
          <View style={[styles.offlineIcon, { backgroundColor: `${accents.amber}1F` }]}>
            <Ionicons name="cloud-offline" size={48} color={accents.amber} />
          </View>
          <AppText variant="title" style={{ textAlign: "center" }}>
            {t("offline.queuedTitle")}
          </AppText>
          <AppText variant="secondary" style={{ textAlign: "center" }}>
            {t("offline.queuedText")}
          </AppText>
        </View>
        <Card accent={accents.amber}>
          <AppText variant="secondary">{t("offline.queuedHint")}</AppText>
        </Card>
        <Button icon="home" label={t("header.home")} onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  const copy = async () => {
    await Clipboard.setStringAsync(receiptId);
    haptic("success");
    setCopied(true);
  };

  return (
    <Screen fullscreen>
      <Celebration colors={gradients.success} />
      <Rise index={1} style={{ gap: spacing.sm }}>
        <AppText variant="title" style={{ textAlign: "center" }}>
          {t(TITLE[type] ?? "success.title")}
        </AppText>
        {TEXT[type] ? (
          <AppText variant="secondary" style={{ textAlign: "center" }}>
            {t(TEXT[type])}
          </AppText>
        ) : null}
      </Rise>

      {/* The receipt, as a ticket with punched notches */}
      <Rise index={2}>
        <View
          style={[
            styles.ticket,
            {
              backgroundColor: theme.surface,
              borderColor: theme.divider,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View style={styles.ticketTop}>
            <AppText variant="label">{t("track.receiptId")}</AppText>
            <Text selectable style={[styles.receipt, { color: theme.text }]}>
              {receiptId}
            </Text>
            <AppText variant="secondary" style={{ textAlign: "center", fontSize: 14 }}>
              {t("success.saveId")}
            </AppText>
          </View>
          <View style={styles.tear}>
            <View
              style={[
                styles.notch,
                styles.notchLeft,
                { backgroundColor: theme.background, borderColor: theme.divider },
              ]}
            />
            <View style={[styles.dashes, { borderColor: theme.divider }]} />
            <View
              style={[
                styles.notch,
                styles.notchRight,
                { backgroundColor: theme.background, borderColor: theme.divider },
              ]}
            />
          </View>
          <View style={styles.ticketActions}>
            <PressableScale
              accessibilityRole="button"
              onPress={() => void copy()}
              style={[styles.action, { backgroundColor: `${theme.primary}12` }]}
            >
              <Ionicons
                name={copied ? "checkmark-done" : "copy-outline"}
                size={20}
                color={theme.primary}
              />
              <AppText style={{ color: theme.primary, fontWeight: "700", fontSize: 14 }}>
                {copied ? t("common.copied") : t("common.copy")}
              </AppText>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              onPress={() => void Share.share({ message: receiptId })}
              style={[styles.action, { backgroundColor: `${accents.violet}12` }]}
            >
              <Ionicons name="share-social-outline" size={20} color={accents.violet} />
              <AppText style={{ color: accents.violet, fontWeight: "700", fontSize: 14 }}>
                {t("app.share")}
              </AppText>
            </PressableScale>
          </View>
          {emailed || texted ? (
            <View style={styles.sentNotes}>
              {emailed ? (
                <View style={styles.note}>
                  <Ionicons name="mail" size={16} color={accents.green} />
                  <AppText variant="secondary" style={{ flex: 1, fontSize: 13 }}>
                    {t("success.emailed")}
                  </AppText>
                </View>
              ) : null}
              {texted ? (
                <View style={styles.note}>
                  <Ionicons name="chatbubble" size={16} color={accents.green} />
                  <AppText variant="secondary" style={{ flex: 1, fontSize: 13 }}>
                    {t("success.texted")}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Rise>

      <Rise index={3}>
        <FollowReport receiptId={receiptId} />
      </Rise>
      <Rise index={4} style={{ gap: spacing.sm }}>
        <Button
          icon="pulse"
          label={t("success.track")}
          onPress={() => router.replace({ pathname: "/track/[receiptId]", params: { receiptId } })}
        />
        <Button
          variant="outline"
          icon="add-circle-outline"
          label={t(ANOTHER[type] ?? "success.another")}
          onPress={() => router.replace({ pathname: "/report", params: { type } })}
        />
        <Button
          variant="ghost"
          icon="home-outline"
          label={t("header.home")}
          onPress={() => router.replace("/")}
        />
      </Rise>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xl },
  offlineIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  ticket: {
    borderWidth: 1,
    borderRadius: radiusLarge,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  ticketTop: { alignItems: "center", gap: 8, padding: spacing.lg, paddingBottom: spacing.md },
  receipt: { fontSize: 30, fontWeight: "800", letterSpacing: 2, textAlign: "center" },
  tear: { height: 28, justifyContent: "center" },
  dashes: { marginHorizontal: 22, borderTopWidth: 2, borderStyle: "dashed" },
  notch: { position: "absolute", width: 28, height: 28, borderRadius: 14, borderWidth: 1 },
  notchLeft: { left: -15 },
  notchRight: { right: -15 },
  ticketActions: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 14,
  },
  sentNotes: { gap: 6, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  note: { flexDirection: "row", alignItems: "center", gap: 8 },
});
