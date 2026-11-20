import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError } from "@/api/client";
import { STATUS_TEXT_GROUP, trackReport, type PublicReport } from "@/api/reports";
import { FollowReport } from "@/components/FollowReport";
import { StatusProgress } from "@/components/StatusProgress";
import { AppText, Badge, Card, Field, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { normaliseReceiptId } from "@/lib/receiptId";
import { accents, gradients, radiusLarge, spacing, statusColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const TYPE_LABEL_KEY: Partial<Record<PublicReport["type"], string>> = {
  commendation: "track.commendation",
  lost_item: "track.lostItem",
  road_incident: "track.roadIncident",
};

export default function ReportStatusScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const params = useLocalSearchParams<{ receiptId: string }>();
  const receiptId = normaliseReceiptId(params.receiptId ?? "");

  const query = useQuery({
    queryKey: ["track", receiptId],
    queryFn: () => trackReport(receiptId),
    enabled: receiptId.length > 0,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 1,
  });

  if (query.isPending) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      tintColor={theme.primary}
    />
  );

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        refreshControl={refresh}
      >
        <Card>
          <AppText variant="heading">
            {notFound ? t("track.notFoundTitle") : t("track.error")}
          </AppText>
          <AppText variant="secondary">
            {notFound ? t("track.notFoundText") : query.error.message}
          </AppText>
        </Card>
      </ScrollView>
    );
  }

  const report = query.data;
  const typeLabelKey = TYPE_LABEL_KEY[report.type];
  const status = t(`statuses.${report.status}`);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={refresh}
    >
      <LinearGradient
        colors={gradients.deep}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerLabel}>
          {t("track.receiptId")}
          {typeLabelKey ? ` · ${t(typeLabelKey)}` : ""}
        </Text>
        <Text style={styles.headerId} selectable>
          {report.receiptId}
        </Text>
        <Badge label={status} color={statusColors[report.status]} solid />
      </LinearGradient>

      <Card accent={statusColors[report.status]}>
        <AppText variant="heading">{t("track.progress", { status })}</AppText>
        <StatusProgress status={report.status} />
        <AppText>{t(`${STATUS_TEXT_GROUP[report.type]}.${report.status}`)}</AppText>
        {report.confirmations > 0 && (
          <AppText variant="secondary">
            {t("track.confirmedByOthers", { count: report.confirmations })}
          </AppText>
        )}
      </Card>

      <FollowReport receiptId={report.receiptId} />

      <Card>
        <SectionTitle icon="document-text" color={accents.sky}>
          {t("track.details")}
        </SectionTitle>
        <Field
          icon="pricetag-outline"
          label={t("track.category")}
          value={t(`categories.${report.category}`)}
        />
        {report.busNumber ? (
          <Field icon="bus-outline" label={t("track.bus")} value={report.busNumber} />
        ) : null}
        {report.routeNumber ? (
          <Field icon="git-commit-outline" label={t("track.route")} value={report.routeNumber} />
        ) : null}
        {report.location ? (
          <Field icon="location-outline" label={t("track.location")} value={report.location} />
        ) : null}
        <Field
          icon="calendar-outline"
          label={t("track.submitted")}
          value={formatDateTime(report.reportedAt, locale)}
        />
        {report.resolvedAt ? (
          <Field
            icon="checkmark-circle-outline"
            label={t("track.resolved")}
            value={formatDateTime(report.resolvedAt, locale)}
          />
        ) : null}
      </Card>

      {report.timeline.length > 0 && (
        <Card>
          <SectionTitle icon="time" color={accents.violet}>
            {t("track.timeline")}
          </SectionTitle>
          {[...report.timeline].reverse().map((entry) => (
            <View
              key={`${entry.status}-${entry.changedAt}`}
              style={[styles.timelineEntry, { borderLeftColor: statusColors[entry.status] }]}
            >
              <AppText variant="label">{formatDateTime(entry.changedAt, locale)}</AppText>
              <AppText style={{ fontWeight: "600" }}>{t(`statuses.${entry.status}`)}</AppText>
              {entry.note ? <AppText variant="secondary">{entry.note}</AppText> : null}
            </View>
          ))}
        </Card>
      )}

      {report.operatorResponses.map((response) => (
        <Card key={response.createdAt} accent={accents.teal}>
          <SectionTitle icon="chatbubbles" color={accents.teal}>
            {response.organisation
              ? t("track.operatorRespondedNamed", { name: response.organisation })
              : t("track.operatorResponded")}
          </SectionTitle>
          <AppText>{response.body}</AppText>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  timelineEntry: { borderLeftWidth: 3, paddingLeft: spacing.md, paddingVertical: spacing.xs },
  header: { borderRadius: radiusLarge + 6, padding: spacing.lg, gap: spacing.sm },
  headerLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  headerId: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", letterSpacing: 1 },
});
