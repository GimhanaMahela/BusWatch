import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { getBusScorecard, getRouteScorecard } from "@/api/explore";
import { CategoryBars, StatRow, StatTile } from "@/components/stats";
import { AppText, Button, Card, Hero, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { accents, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

/** A bus's or route's public scorecard (published only with enough admin-checked reports). */
export function ScorecardView({ kind, id }: { kind: "bus" | "route"; id: string }) {
  const { t } = useI18n();
  const theme = useTheme();
  const scorecard = useQuery({
    queryKey: ["scorecard", kind, id],
    queryFn: () => (kind === "bus" ? getBusScorecard(id) : getRouteScorecard(id)),
  });
  const card = scorecard.data;

  const reportParams = kind === "bus" ? { bus: id } : { route: id };

  return (
    <Screen>
      <Hero
        eyebrow={t(kind === "bus" ? "scorecard.busEyebrow" : "scorecard.routeEyebrow")}
        title={kind === "bus" ? (card?.busName ? `${id} · ${card.busName}` : id) : id}
        subtitle={
          card?.routes?.length
            ? t("scorecard.routes", { routes: card.routes.join(", ") })
            : undefined
        }
      />

      {scorecard.isPending && <ActivityIndicator color={theme.primary} size="large" />}
      {scorecard.isError && (
        <AppText style={{ color: theme.error }}>{scorecard.error.message}</AppText>
      )}

      {card && !card.published && (
        <Card accent={accents.amber}>
          <SectionTitle icon="hourglass" color={accents.amber}>
            {t("scorecard.notPublishedTitle")}
          </SectionTitle>
          <AppText variant="secondary">
            {t("scorecard.notPublishedText", { min: card.minPublicReports })}
          </AppText>
        </Card>
      )}

      {card?.published && (
        <>
          {card.complaints ? (
            <>
              <StatRow>
                <StatTile
                  icon="document-text"
                  color={accents.blue}
                  value={String(card.complaints.checked)}
                  label={t("scorecard.checked")}
                />
                <StatTile
                  icon="checkmark-done"
                  color={accents.green}
                  value={String(card.complaints.resolved)}
                  label={t("scorecard.resolved")}
                />
              </StatRow>
              <StatRow>
                <StatTile
                  icon="pie-chart"
                  color={accents.violet}
                  value={`${Math.round(card.complaints.resolutionRate * 100)}%`}
                  label={t("scorecard.resolutionRate")}
                />
                <StatTile
                  icon="sync"
                  color={accents.orange}
                  value={String(card.complaints.inProgress)}
                  label={t("scorecard.inProgress")}
                />
              </StatRow>
              {card.complaints.byCategory.length > 0 && (
                <Card>
                  <SectionTitle icon="warning" color={accents.red}>
                    {t("scorecard.complaintsTitle")}
                  </SectionTitle>
                  <CategoryBars items={card.complaints.byCategory} />
                </Card>
              )}
            </>
          ) : (
            <Card>
              <AppText variant="secondary">
                {t("scorecard.complaintsHidden", { min: card.minPublicReports })}
              </AppText>
            </Card>
          )}

          {card.commendations && card.commendations.count > 0 && (
            <Card accent={accents.green}>
              <SectionTitle icon="heart" color={accents.green}>
                {t("scorecard.praiseTitle")}
              </SectionTitle>
              <CategoryBars items={card.commendations.byCategory} />
            </Card>
          )}

          {card.buses && card.buses.length > 0 && (
            <Card>
              <SectionTitle icon="bus" color={accents.sky}>
                {t("scorecard.busesTitle")}
              </SectionTitle>
              {card.buses.map((bus) => (
                <Pressable
                  key={bus.busNumber}
                  accessibilityRole="link"
                  onPress={() =>
                    router.push({
                      pathname: "/bus/[busNumber]",
                      params: { busNumber: bus.busNumber },
                    })
                  }
                  style={[styles.row, { borderTopColor: theme.divider }]}
                >
                  <AppText style={{ flex: 1, fontWeight: "700" }}>{bus.busNumber}</AppText>
                  <AppText variant="secondary">
                    {t("scorecard.reportsCount", { count: bus.count })}
                  </AppText>
                </Pressable>
              ))}
            </Card>
          )}
        </>
      )}

      <View style={{ gap: spacing.sm }}>
        <Button
          variant="accent"
          icon="megaphone"
          label={t("scorecard.reportCta")}
          onPress={() => router.push({ pathname: "/report", params: reportParams })}
        />
        <Button
          variant="outline"
          icon="heart-outline"
          label={t("scorecard.commendCta")}
          onPress={() =>
            router.push({ pathname: "/report", params: { ...reportParams, type: "commendation" } })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
  },
});
