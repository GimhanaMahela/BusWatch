import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OutboxNotice } from "@/components/OutboxNotice";
import { ActionTile, AppText, Button, Card, Hero, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutbox } from "@/lib/OutboxProvider";
import { accents, spacing } from "@/theme/colors";

const STEPS = [
  { title: "home.step1Title", text: "home.step1Text", color: accents.orange },
  { title: "home.step2Title", text: "home.step2Text", color: accents.sky },
  { title: "home.step3Title", text: "home.step3Text", color: accents.green },
] as const;

export default function HomeScreen() {
  const { t } = useI18n();
  const { queued, sent } = useOutbox();

  return (
    <Screen>
      <Hero
        eyebrow={t("home.badge")}
        title={t("home.titleStart")}
        highlight={t("home.titleHighlight")}
        subtitle={t("home.subtitle")}
      >
        <Button
          variant="accent"
          icon="megaphone"
          label={t("home.reportCta")}
          onPress={() => router.push("/report")}
        />
        <Button
          variant="light"
          icon="search"
          label={t("home.trackCta")}
          onPress={() => router.navigate("/track")}
        />
      </Hero>

      <OutboxNotice />

      <View style={styles.grid}>
        <ActionTile
          icon="alert-circle"
          color={accents.orange}
          title={t("home.reportCta")}
          subtitle={t("home.promiseAccount")}
          onPress={() => router.push("/report")}
        />
        <ActionTile
          icon="pulse"
          color={accents.sky}
          title={t("home.trackCta")}
          subtitle={sent.length > 0 ? t("app.sentFromPhone") : t("home.quickTrackText")}
          onPress={() => router.navigate("/track")}
        />
      </View>
      <View style={styles.grid}>
        <ActionTile
          icon="cloud-upload"
          color={queued.length > 0 ? accents.amber : accents.teal}
          title={t("app.outboxTitle")}
          subtitle={
            queued.length > 0
              ? t("offline.waiting", { count: queued.length })
              : t("app.outboxEmpty")
          }
          onPress={() => router.push("/outbox")}
        />
        <ActionTile
          icon="language"
          color={accents.violet}
          title={t("common.language")}
          subtitle={t("home.promiseLanguages")}
          onPress={() => router.navigate("/settings")}
        />
      </View>

      <Card>
        <SectionTitle icon="sparkles" color={accents.orange}>
          {t("home.howTitle")}
        </SectionTitle>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText style={{ fontWeight: "700" }}>{t(step.title)}</AppText>
              <AppText variant="secondary">{t(step.text)}</AppText>
            </View>
          </View>
        ))}
      </Card>

      <AppText variant="secondary" style={styles.footer}>
        {t("home.promiseEmail")} · {t("home.promiseEvidence")}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: spacing.md },
  step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  footer: { textAlign: "center", fontSize: 13 },
});
