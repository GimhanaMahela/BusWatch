// "Your recent reports" on Home: the reports sent from this phone, each with its live status.
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { trackReport } from "@/api/reports";
import { PressableScale, Skeleton } from "@/components/motion";
import { AppText, Badge, SectionHeader } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { useOutbox } from "@/lib/OutboxProvider";
import { accents, categoryStyle, radiusLarge, spacing, statusColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const STEP: Record<string, number> = {
  pending: 1,
  reviewed: 2,
  escalated: 3,
  resolved: 4,
  rejected: 4,
};

export function RecentReports() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const { sent } = useOutbox();
  const recent = sent.slice(0, 5);
  const reports = useQueries({
    queries: recent.map(({ receiptId }) => ({
      queryKey: ["report", receiptId],
      queryFn: () => trackReport(receiptId),
    })),
  });

  if (recent.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader
        title={t("app.recentTitle")}
        action={t("app.seeAll")}
        onAction={() => router.navigate("/track")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.bleed}
      >
        {recent.map(({ receiptId, sentAt }, index) => {
          const report = reports[index]?.data;
          const color = report ? statusColors[report.status] : theme.divider;
          const look = report ? categoryStyle[report.category] : undefined;
          return (
            <PressableScale
              key={receiptId}
              accessibilityRole="link"
              accessibilityLabel={receiptId}
              onPress={() => router.push({ pathname: "/track/[receiptId]", params: { receiptId } })}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.divider,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <View style={styles.top}>
                <View style={[styles.icon, { backgroundColor: `${look?.color ?? accents.sky}1F` }]}>
                  <Ionicons
                    name={(look?.icon ?? "document-text-outline") as "document-text-outline"}
                    size={20}
                    color={look?.color ?? accents.sky}
                  />
                </View>
                <Ionicons name="arrow-forward" size={18} color={theme.textSecondary} />
              </View>
              <AppText style={styles.id}>{receiptId}</AppText>
              {report ? (
                <>
                  <AppText variant="secondary" numberOfLines={1} style={{ fontSize: 13 }}>
                    {t(`categories.${report.category}`)}
                  </AppText>
                  <Badge label={t(`statuses.${report.status}`)} color={color} />
                  {/* How far along: four segments, received → resolved */}
                  <View style={styles.segments}>
                    {[1, 2, 3, 4].map((segment) => (
                      <View
                        key={segment}
                        style={[
                          styles.segment,
                          {
                            backgroundColor:
                              segment <= (STEP[report.status] ?? 1) ? color : theme.surfaceAlt,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <View style={{ gap: 8 }}>
                  <Skeleton height={14} width="70%" />
                  <Skeleton height={26} width={96} radius={13} />
                </View>
              )}
              <AppText variant="secondary" style={{ fontSize: 12 }}>
                {formatDateTime(sentAt, locale)}
              </AppText>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -spacing.md },
  row: { paddingHorizontal: spacing.md, gap: spacing.sm + 4, paddingBottom: 12, paddingTop: 2 },
  card: {
    width: 220,
    borderWidth: 1,
    borderRadius: radiusLarge,
    padding: spacing.md,
    gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  id: { fontWeight: "800", letterSpacing: 0.6, fontSize: 15 },
  segments: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
});
