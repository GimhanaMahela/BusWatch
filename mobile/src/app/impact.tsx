import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { getImpact } from "@/api/explore";
import { TextField } from "@/components/form";
import { CategoryBars, StatRow, StatTile } from "@/components/stats";
import { AppText, Button, Card, Hero, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { parseBusNumber } from "@/lib/qr";
import { accents, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const percent = (value: number | null) => (value === null ? "–" : `${Math.round(value * 100)}%`);

export default function ImpactScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const [bus, setBus] = useState("");
  const impact = useQuery({ queryKey: ["impact"], queryFn: getImpact });

  const lookUp = () => {
    const busNumber = parseBusNumber(bus);
    if (busNumber) router.push({ pathname: "/bus/[busNumber]", params: { busNumber } });
  };

  const data = impact.data;
  const totals = data?.totals;
  const hours = totals?.medianHoursToResolve ?? null;

  return (
    <Screen>
      <Hero
        eyebrow={t("impact.eyebrow")}
        title={t("impact.title")}
        subtitle={t("impact.subtitle")}
      />

      {impact.isPending && <ActivityIndicator color={theme.primary} size="large" />}
      {impact.isError && <AppText style={{ color: theme.error }}>{impact.error.message}</AppText>}

      {data && totals && (
        <>
          <StatRow>
            <StatTile
              icon="document-text"
              color={accents.blue}
              value={String(totals.received)}
              label={t("impact.received")}
              hint={t("impact.receivedHint", { count: totals.receivedThisMonth })}
            />
            <StatTile
              icon="checkmark-done"
              color={accents.green}
              value={String(totals.resolved)}
              label={t("impact.resolved")}
              hint={t("impact.resolvedHint", { count: totals.resolvedThisMonth })}
            />
          </StatRow>
          <StatRow>
            <StatTile
              icon="pie-chart"
              color={accents.violet}
              value={percent(totals.resolutionRate)}
              label={t("impact.resolutionRate")}
              hint={t("impact.resolutionRateHint", { checked: totals.checked })}
            />
            <StatTile
              icon="timer"
              color={accents.orange}
              value={
                hours === null
                  ? "–"
                  : hours < 48
                    ? t("impact.hours", { value: Math.round(hours) })
                    : t("impact.days", { value: Math.round(hours / 24) })
              }
              label={t("impact.medianTime")}
              hint={t("impact.medianTimeHint")}
            />
          </StatRow>
          <StatRow>
            <StatTile
              icon="heart"
              color={accents.pink}
              value={String(totals.commendations)}
              label={t("impact.commendations")}
            />
            <StatTile
              icon="star"
              color={accents.amber}
              value={totals.averageRating === null ? "–" : `${totals.averageRating.toFixed(1)} / 5`}
              label={t("impact.rating")}
              hint={t("impact.ratingHint", { count: totals.ratings })}
            />
          </StatRow>

          {data.byCategory.length > 0 && (
            <Card>
              <SectionTitle icon="bar-chart" color={accents.sky}>
                {t("impact.categoriesTitle")}
              </SectionTitle>
              <AppText variant="secondary">{t("impact.categoriesSubtitle")}</AppText>
              <CategoryBars items={data.byCategory} />
            </Card>
          )}

          <Card>
            <SectionTitle icon="git-network" color={accents.teal}>
              {t("impact.routesTitle")}
            </SectionTitle>
            {data.topRoutes.length === 0 ? (
              <AppText variant="secondary">{t("impact.routesEmpty")}</AppText>
            ) : (
              data.topRoutes.map((route) => (
                <Pressable
                  key={route.routeNumber}
                  accessibilityRole="link"
                  onPress={() =>
                    router.push({
                      pathname: "/route/[routeNumber]",
                      params: { routeNumber: route.routeNumber },
                    })
                  }
                  style={[styles.route, { borderTopColor: theme.divider }]}
                >
                  <AppText style={{ flex: 1, fontWeight: "700" }}>{route.routeNumber}</AppText>
                  <AppText variant="secondary">
                    {t("scorecard.reportsCount", { count: route.count })}
                  </AppText>
                </Pressable>
              ))
            )}
          </Card>

          <AppText variant="secondary" style={{ textAlign: "center" }}>
            {t("impact.updated", { time: formatDateTime(data.updatedAt, locale) })}
          </AppText>
        </>
      )}

      <Card accent={accents.violet}>
        <SectionTitle icon="bus" color={accents.violet}>
          {t("impact.lookupTitle")}
        </SectionTitle>
        <AppText variant="secondary">
          {t("impact.lookupText", { min: impact.data?.minPublicReports ?? 3 })}
        </AppText>
        <TextField
          label={t("impact.lookupLabel")}
          value={bus}
          onChangeText={setBus}
          onSubmitEditing={lookUp}
          placeholder="NB-1234"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button
          icon="ribbon"
          label={t("impact.lookupButton")}
          onPress={lookUp}
          disabled={!parseBusNumber(bus)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  route: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
  },
});
