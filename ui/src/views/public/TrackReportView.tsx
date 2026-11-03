"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { Alert, Box, Card, Container, Grid, Skeleton, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { ApiError, errorMessage } from "@/api/apiClient";
import { StatusChip } from "@/components/atoms";
import { DetailRow, EmptyState, ReceiptSearchForm } from "@/components/molecules";
import { HeroBand } from "@/components/templates";
import { categoryLabel, statusLabel, type ReportStatus } from "@/constants/reportConstants";
import { useTrackedReport } from "@/hooks/useReportQueries";
import { formatDateTime } from "@/lib/format";

const STATUS_DESCRIPTIONS: Record<ReportStatus, string> = {
  pending: "We've received your report and it is waiting to be reviewed.",
  reviewed: "Our team has reviewed your report.",
  escalated: "Your report has been passed on to the bus operator or authorities.",
  resolved: "Action has been taken on your report.",
  rejected: "This report was closed without further action.",
};

// The happy path a report moves along; "rejected" ends it early
const PIPELINE: ReportStatus[] = ["pending", "reviewed", "escalated", "resolved"];

function StatusPipeline({ status }: { status: ReportStatus }) {
  const closed = status === "rejected";
  const reached = closed ? 0 : PIPELINE.indexOf(status);
  return (
    <Box sx={{ display: "flex", gap: 1, mt: 3 }} aria-label={`Progress: ${statusLabel(status)}`}>
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
              {i === 0 ? "Received" : statusLabel(s)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function TrackReportView({ receiptId }: { receiptId?: string }) {
  const router = useRouter();
  const {
    data: report,
    error: lookupError,
    isFetching: loading,
    refetch,
  } = useTrackedReport(receiptId);

  const notFound = lookupError instanceof ApiError && lookupError.status === 404;

  // The URL is the source of truth, so a tracking link can be shared or bookmarked
  const handleSearch = (id: string) => {
    if (id === receiptId) void refetch();
    else router.push(`/track/${encodeURIComponent(id)}`);
  };

  return (
    <>
      <HeroBand
        eyebrow="Track a report"
        title="Where does my report stand?"
        subtitle="Enter the receipt ID you got after submitting. Every status change and message from our team shows up here."
      >
        <Box sx={{ mt: 4, maxWidth: 620 }}>
          <ReceiptSearchForm
            defaultValue={receiptId ?? ""}
            loading={loading}
            onSearch={handleSearch}
            size="large"
          />
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
                title="We couldn't find a report with that Receipt ID."
                description="Check it and try again. Receipt IDs look like BW-2026-XXXXXX."
              />
            </Card>
          ) : (
            <Alert severity="error">
              {errorMessage(lookupError, "Something went wrong. Please try again.")}
            </Alert>
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
                      Receipt ID
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
                  <StatusChip status={report.status} />
                </Box>
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  {STATUS_DESCRIPTIONS[report.status]}
                </Typography>
                {report.status === "rejected" ? (
                  <Alert severity="info" icon={<DoNotDisturbOnRoundedIcon />} sx={{ mt: 3 }}>
                    This report is closed.
                  </Alert>
                ) : (
                  <StatusPipeline status={report.status} />
                )}

                <Typography variant="subtitle1" component="h2" sx={{ mt: 5, mb: 2 }}>
                  Timeline
                </Typography>
                <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {[...report.timeline].reverse().map((entry, index, list) => (
                    <Box
                      component="li"
                      key={`${entry.changedAt}-${index}`}
                      sx={{ display: "flex", gap: 2 }}
                    >
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                        <Typography sx={{ fontWeight: 700 }}>
                          {statusLabel(entry.status)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(entry.changedAt)}
                        </Typography>
                        {entry.note && (
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
                            {entry.note}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle1" component="h2" sx={{ mb: 1 }}>
                  Report details
                </Typography>
                <DetailRow label="Category">{categoryLabel(report.category)}</DetailRow>
                <DetailRow label="Bus">{report.busNumber}</DetailRow>
                <DetailRow label="Route">{report.routeNumber}</DetailRow>
                <DetailRow label="Location">{report.location}</DetailRow>
                {report.incidentAt && (
                  <DetailRow label="Incident time">{formatDateTime(report.incidentAt)}</DetailRow>
                )}
                <DetailRow label="Submitted">{formatDateTime(report.reportedAt)}</DetailRow>
                {report.resolvedAt && (
                  <DetailRow label="Resolved">{formatDateTime(report.resolvedAt)}</DetailRow>
                )}
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}

export default TrackReportView;
