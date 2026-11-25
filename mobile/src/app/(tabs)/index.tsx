import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, StyleSheet, View } from "react-native";

import { getImpact } from "@/api/explore";
import { Float, PressableScale, Rise, useCountUp } from "@/components/motion";
import { OutboxNotice } from "@/components/OutboxNotice";
import { RecentReports } from "@/components/RecentReports";
import { Text } from "@/components/Text";
import { ActionTile, AppText, Button, Card, Screen, SectionHeader } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutbox } from "@/lib/OutboxProvider";
import { accents, gradients, radiusLarge, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const STEPS = [
  { title: "home.step1Title", text: "home.step1Text", color: accents.orange, icon: "create" },
  { title: "home.step2Title", text: "home.step2Text", color: accents.sky, icon: "receipt" },
  {
    title: "home.step3Title",
    text: "home.step3Text",
    color: accents.green,
    icon: "checkmark-done",
  },
] as const;

const greetingKey = () => {
  const hour = new Date().getHours();
  return hour < 12
    ? "app.greetingMorning"
    : hour < 17
      ? "app.greetingAfternoon"
      : "app.greetingEvening";
};

/** A headline number in the hero; counts up when the numbers arrive */
function HeroStat({ value, label }: { value: number | undefined; label: string }) {
  const shown = useCountUp(value);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value === undefined ? "–" : shown.toLocaleString()}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const { queued } = useOutbox();
  // The public totals; the hero simply shows dashes when offline
  const impact = useQuery({ queryKey: ["impact"], queryFn: getImpact });
  const totals = impact.data?.totals;

  return (
    <Screen tab>
      <Rise index={0} style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="secondary" style={{ fontSize: 14 }}>
            {t(greetingKey())} 👋
          </AppText>
          <Text style={[styles.wordmark, { color: theme.text }]}>
            Transit<Text style={[styles.wordmark, { color: accents.orange }]}>X</Text>
          </Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t("safety.eyebrow")}
          onPress={() => router.push("/safety")}
          haptics="medium"
          style={[
            styles.sos,
            { backgroundColor: `${accents.pink}1A`, borderColor: `${accents.pink}55` },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color={accents.pink} />
          <Text style={[styles.sosText, { color: accents.pink }]}>{t("header.safety")}</Text>
        </PressableScale>
      </Rise>

      <Rise index={1}>
        <LinearGradient
          colors={gradients.deep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.glow, { top: -90, right: -70, backgroundColor: "#029EEE" }]} />
          <View style={[styles.glow, { bottom: -120, left: -80, backgroundColor: "#FE6E01" }]} />
          <View style={styles.heroTop}>
            <View style={{ flex: 1, gap: 10 }}>
              <View style={styles.eyebrow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowText} numberOfLines={1}>
                  {t("home.badge")}
                </Text>
              </View>
              <Text style={styles.heroTitle}>
                {t("home.titleStart")}
                <Text style={[styles.heroTitle, { color: "#FFAD73" }]}>
                  {" "}
                  {t("home.titleHighlight")}
                </Text>
              </Text>
            </View>
            <Float style={styles.logoBubble}>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </Float>
          </View>
          <Text style={styles.heroSubtitle}>{t("home.subtitle")}</Text>
          <View style={{ gap: spacing.sm }}>
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
          </View>
          <PressableScale
            accessibilityRole="link"
            onPress={() => router.push("/impact")}
            haptics="selection"
            style={styles.stats}
          >
            <HeroStat value={totals?.received} label={t("impact.received")} />
            <View style={styles.statDivider} />
            <HeroStat value={totals?.resolved} label={t("impact.resolved")} />
            <View style={styles.statDivider} />
            <HeroStat value={totals?.commendations} label={t("impact.commendations")} />
          </PressableScale>
        </LinearGradient>
      </Rise>

      <OutboxNotice />
      {queued.length > 0 && (
        <Card accent={accents.amber} onPress={() => router.push("/outbox")}>
          <View style={styles.inline}>
            <Ionicons name="cloud-upload" size={22} color={accents.amber} />
            <AppText style={{ flex: 1, fontWeight: "700" }}>
              {t("offline.waiting", { count: queued.length })}
            </AppText>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </View>
        </Card>
      )}

      <Rise index={2}>
        <RecentReports />
      </Rise>

      <Rise index={3}>
        <SectionHeader title={t("app.quickActions")} />
      </Rise>
      <Rise index={4} style={styles.grid}>
        <ActionTile
          icon="heart"
          color={accents.green}
          title={t("header.commend")}
          subtitle={t("commend.eyebrow")}
          onPress={() => router.push({ pathname: "/report", params: { type: "commendation" } })}
        />
        <ActionTile
          icon="briefcase"
          color={accents.amber}
          title={t("lost.eyebrow")}
          subtitle={t("home.lostTitle")}
          onPress={() => router.push({ pathname: "/report", params: { type: "lost_item" } })}
        />
      </Rise>
      <Rise index={5} style={styles.grid}>
        <ActionTile
          icon="qr-code"
          color={accents.violet}
          title={t("app.scanTitle")}
          subtitle={t("app.scanTile")}
          onPress={() => router.push("/scan")}
        />
        <ActionTile
          icon="calculator"
          color={accents.teal}
          title={t("fare.eyebrow")}
          subtitle={t("home.fareTitle")}
          onPress={() => router.push("/fare")}
        />
      </Rise>

      <Rise index={6}>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.push("/safety")}
          haptics="medium"
        >
          <LinearGradient
            colors={["#DB2777", "#BE185D", "#831843"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <View style={styles.bannerIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.bannerTitle}>{t("home.safetyTitle")}</Text>
              <Text style={styles.bannerText}>{t("home.safetyText")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
          </LinearGradient>
        </PressableScale>
      </Rise>

      <Rise index={7}>
        <SectionHeader title={t("app.exploreTitle")} />
      </Rise>
      <Rise index={8} style={styles.grid}>
        <ActionTile
          icon="stats-chart"
          color={accents.blue}
          title={t("impact.eyebrow")}
          subtitle={t("home.statsTitle")}
          onPress={() => router.push("/impact")}
        />
        <ActionTile
          icon="chatbubbles"
          color={accents.orange}
          title={t("helper.title")}
          subtitle={t("helper.subtitle")}
          onPress={() => router.push("/chat")}
        />
      </Rise>

      <Rise index={9}>
        <Card>
          <AppText variant="label" style={{ color: accents.orange }}>
            {t("home.howEyebrow")}
          </AppText>
          <AppText variant="heading">{t("home.howTitle")}</AppText>
          {STEPS.map((step, index) => (
            <View key={step.title} style={styles.step}>
              <View style={{ alignItems: "center" }}>
                <LinearGradient colors={[step.color, `${step.color}B3`]} style={styles.stepIcon}>
                  <Ionicons name={step.icon} size={18} color="#FFFFFF" />
                </LinearGradient>
                {index < STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: theme.divider }]} />
                )}
              </View>
              <View style={{ flex: 1, gap: 2, paddingBottom: spacing.sm }}>
                <AppText style={{ fontWeight: "700" }}>{t(step.title)}</AppText>
                <AppText variant="secondary">{t(step.text)}</AppText>
              </View>
            </View>
          ))}
        </Card>
      </Rise>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  wordmark: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  sos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 40,
  },
  sosText: { fontWeight: "700", fontSize: 14 },
  hero: {
    borderRadius: radiusLarge + 8,
    padding: spacing.lg - 4,
    gap: spacing.md,
    overflow: "hidden",
  },
  glow: { position: "absolute", width: 240, height: 240, borderRadius: 120, opacity: 0.3 },
  heroTop: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxWidth: "100%",
  },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FFAD73" },
  eyebrowText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", flexShrink: 1 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    lineHeight: 37,
    letterSpacing: -0.8,
  },
  heroSubtitle: { color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 23 },
  logoBubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#029EEE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: { width: 76, height: 54 },
  stats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 4 },
  statValue: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.16)", marginVertical: 4 },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  grid: { flexDirection: "row", gap: spacing.md },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radiusLarge,
    padding: spacing.md + 2,
    overflow: "hidden",
  },
  bannerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  bannerText: { color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 19 },
  step: { flexDirection: "row", gap: spacing.md },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: { width: 2, flex: 1, marginTop: 4, borderRadius: 1 },
});
