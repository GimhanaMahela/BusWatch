"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import {
  Alert,
  Box,
  Card,
  Chip,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect } from "react";
import { ApiError, errorMessage } from "@/api/apiClient";
import { trackEvent } from "@/api/metricsApi";
import { StatusChip } from "@/components/atoms";
import { DetailRow, EmptyState, ReceiptSearchForm, ShareButton } from "@/components/molecules";
import { OutcomeRating } from "@/components/organisms";
import { HeroBand } from "@/components/templates";
import type { ReportStatus } from "@/constants/reportConstants";
import useIsClient from "@/hooks/useIsClient";
import { useTrackedReport } from "@/hooks/useReportQueries";
import { recentReceipts, recordTrackingVisit } from "@/lib/trackingHistory";

// The happy path a report moves along; "rejected" ends it early
const PIPELINE: ReportStatus[] = ["pending", "reviewed", "escalated", "resolved"];

// The API writes these first timeline notes in English; show them in the passenger's language
const SYSTEM_NOTES = {
  "Report received.": "noteReportReceived",
  "Commendation received.": "noteCommendationReceived",
} as const;

function StatusPipeline({ status }: { status: ReportStatus }) {
  const t = useTranslations("track");
  const tStatus = useTranslations("statuses");
  const closed = status === "rejected";
  const reached = closed ? 0 : PIPELINE.indexOf(status);
  return (
    <Box
      sx={{ display: "flex", gap: 1, mt: 3 }}
      aria-label={t("progress", { status: tStatus(status) })}
    >
      {PIPELINE.map((s, i) => {
        const done = !closed && i <= reached;
        return (
          <Box key={s} sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: done
                  ? status === "resolved"
                    ? "success.main"
                    : "primary.main"
                  : "action.hover",
                transition: "background-color 0.4s",
              }}
            />
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: "block",
                mt: 0.75,
                fontWeight: done ? 700 : 500,
                color: done ? "text.primary" : "text.secondary",
              }}
            >
              {i === 0 ? t("received") : tStatus(s)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

/** Receipt IDs submitted or looked up on this device, so a passenger can find them again. */
function DeviceReceipts({ current }: { current?: string }) {
  // localStorage only exists in the browser; render nothing until hydrated
  const isClient = useIsClient();
  const receipts = isClient ? recentReceipts() : [];
  const others = receipts.filter((id) => id !== current?.trim().toUpperCase());
  if (others.length === 0) return null;
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 2 }}>
      {others.slice(0, 6).map((id) => (
        <Chip
          key={id}
          icon={<ReceiptLongRoundedIcon />}
          label={id}
          component="a"
          href={`/track/${encodeURIComponent(id)}`}
          clickable
          variant="outlined"
          sx={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}
        />
      ))}
    </Stack>
  );
}

function TrackReportView({ receiptId }: { receiptId?: string }) {
  const t = useTranslations("track");
  const tStatus = useTranslations("statuses");
  const tCategory = useTranslations("categories");
  const tShare = useTranslations("share");
  const format = useFormatter();
  const router = useRouter();
  const {
    data: report,
    error: lookupError,
    isFetching: loading,
    refetch,
  } = useTrackedReport(receiptId);

  const notFound = lookupError instanceof ApiError && lookupError.status === 404;
  const formatDateTime = (value?: string | null) =>
    value ? format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" }) : null;

  // Success metric: do passengers come back to follow their report?
  const loadedReceipt = report?.receiptId;
  useEffect(() => {
    if (!loadedReceipt) return;
    const { counted, returning } = recordTrackingVisit(loadedReceipt);
    if (counted) trackEvent("tracking_view");
    if (returning) trackEvent("tracking_return_view");
  }, [loadedReceipt]);

  // Arriving from the "rate the outcome" link in the resolution email
  useEffect(() => {
    if (report?.canRate && window.location.hash === "#rate") {
      document.getElementById("rate")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [report?.canRate]);

  // The URL is the source of truth, so a tracking link can be shared or bookmarked
  const handleSearch = (id: string) => {
    if (id === receiptId) void refetch();
    else router.push(`/track/${encodeURIComponent(id)}`);
  };

  const commendation = report?.type === "commendation";
  const descriptions = commendation ? "commend" : "complaint";

  return (
    <>
      <HeroBand eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
        <Box sx={{ mt: 4, maxWidth: 620 }}>
          <ReceiptSearchForm
            defaultValue={receiptId ?? ""}
            loading={loading}
            onSearch={handleSearch}
            size="large"
          />
          <DeviceReceipts current={receiptId} />
        </Box>
      </HeroBand>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        {loading && (
          <Card sx={{ p: 4 }}>
            <Skeleton width="40%" height={40} />
            <Skeleton width="70%" />
            <Skeleton variant="rounded" height={8} sx={{ mt: 3 }} />
            <Skeleton variant="rounded" height={160} sx={{ mt: 4 }} />
          </Card>
        )}

        {!loading &&
          lookupError &&
          (notFound ? (
            <Card>
              <EmptyState
                icon={<SearchOffRoundedIcon />}
                title={t("notFoundTitle")}
                description={t("notFoundText")}
              />
            </Card>
          ) : (
            <Alert severity="error">{errorMessage(lookupError, t("error"))}</Alert>
          ))}

        {report && !loading && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t("receiptId")}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "ui-monospace, monospace",
                        fontWeight: 800,
                        fontSize: "1.5rem",
                      }}
                    >
                      {report.receiptId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    {commendation && (
                      <Chip
                        icon={<ThumbUpAltRoundedIcon />}
                        label={t("commendation")}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    <StatusChip status={report.status} label={tStatus(report.status)} />
                  </Box>
                </Box>
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  {t(`${descriptions}.${report.status}`)}
                </Typography>
                {report.status === "rejected" ? (
                  <Alert severity="info" icon={<DoNotDisturbOnRoundedIcon />} sx={{ mt: 3 }}>
                    {t("closed")}
                  </Alert>
                ) : (
                  <StatusPipeline status={report.status} />
                )}

                <Typography variant="subtitle1" component="h2" sx={{ mt: 5, mb: 2 }}>
                  {t("timeline")}
                </Typography>
                <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {[...report.timeline].reverse().map((entry, index, list) => {
                    const systemNote =
                      entry.note && entry.note in SYSTEM_NOTES
                        ? t(SYSTEM_NOTES[entry.note as keyof typeof SYSTEM_NOTES])
                        : entry.note;
                    return (
                      <Box
                        component="li"
                        key={`${entry.changedAt}-${index}`}
                        sx={{ display: "flex", gap: 2 }}
                      >
                        <Box
                          sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                              color: index === 0 ? "common.white" : "primary.main",
                              bgcolor:
                                index === 0
                                  ? "primary.main"
                                  : "rgba(var(--mui-palette-primary-mainChannel) / 0.12)",
                            }}
                          >
                            <CheckRoundedIcon sx={{ fontSize: 16 }} />
                          </Box>
                          {index < list.length - 1 && (
                            <Box sx={{ width: 2, flex: 1, bgcolor: "divider", my: 0.5 }} />
                          )}
                        </Box>
                        <Box sx={{ pb: 3, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }}>{tStatus(entry.status)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(entry.changedAt)}
                          </Typography>
                          {systemNote && (
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: "action.hover",
                                whiteSpace: "pre-line",
                              }}
                            >
                              {systemNote}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={3}>
                {report.canRate && <OutcomeRating key={report.ratedAt ?? "new"} report={report} />}
                <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle1" component="h2" sx={{ mb: 1 }}>
                    {t("details")}
                  </Typography>
                  <DetailRow label={t("category")}>{tCategory(report.category)}</DetailRow>
                  <DetailRow label={t("bus")}>{report.busNumber}</DetailRow>
                  <DetailRow label={t("route")}>{report.routeNumber}</DetailRow>
                  {report.location && (
                    <DetailRow label={t("location")}>{report.location}</DetailRow>
                  )}
                  {report.incidentAt && (
                    <DetailRow label={t("incidentTime")}>
                      {formatDateTime(report.incidentAt)}
                    </DetailRow>
                  )}
                  <DetailRow label={t("submitted")}>{formatDateTime(report.reportedAt)}</DetailRow>
                  {report.resolvedAt && (
                    <DetailRow label={t("resolved")}>{formatDateTime(report.resolvedAt)}</DetailRow>
                  )}
                  <ShareButton
                    fullWidth
                    sx={{ mt: 2 }}
                    path={`/track/${encodeURIComponent(report.receiptId)}`}
                    title={tShare("title", { receiptId: report.receiptId })}
                    text={tShare("text", { status: tStatus(report.status) })}
                    onShared={() => trackEvent("report_shared")}
                  />
                </Card>
              </Stack>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}

export default TrackReportView;
