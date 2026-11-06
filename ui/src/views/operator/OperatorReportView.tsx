"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { Alert, Box, Button, Card, Chip, Grid, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/api/apiClient";
import { GradientButton, StatusChip } from "@/components/atoms";
import { DetailRow, EmptyState, LoadingState, SectionPanel } from "@/components/molecules";
import { categoryLabel, statusLabel } from "@/constants/reportConstants";
import { useFleetReport, useRespondToReport } from "@/hooks/useOperatorQueries";
import { formatDateTime, timeAgo } from "@/lib/format";

const MAX_RESPONSE = 2000; // Must match MAX_OPERATOR_RESPONSE_LENGTH in the API

function OperatorReportView({ id }: { id: string }) {
  const report = useFleetReport(id);
  const respond = useRespondToReport(id);
  const [body, setBody] = useState("");

  if (report.isPending) return <LoadingState message="Loading the report..." />;
  if (report.error) {
    const notFound = report.error instanceof ApiError && report.error.status === 404;
    return (
      <Card>
        <EmptyState
          icon={<SearchOffRoundedIcon />}
          title={notFound ? "Report not found" : "Could not load the report"}
          description={
            notFound
              ? "It may not be about one of your buses, or the BusWatch team hasn't checked it yet."
              : errorMessage(report.error, "Please try again.")
          }
          action={<Button href="/operator">Back to your reports</Button>}
        />
      </Card>
    );
  }
  const r = report.data;
  const commendation = r.type === "commendation";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    respond.mutate(body, { onSuccess: () => setBody("") });
  };

  return (
    <>
      <Button href="/operator" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2 }}>
        Your reports
      </Button>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.5 }}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: "1.6rem", md: "2rem" } }}>
          {r.busNumber} · Route {r.routeNumber}
        </Typography>
        <StatusChip status={r.status} />
        {commendation && (
          <Chip label="Commendation" color="success" variant="outlined" size="small" />
        )}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {categoryLabel(r.category)} · reported {timeAgo(r.reportedAt)}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }} sx={{ display: "grid", gap: 3, alignContent: "start" }}>
          <SectionPanel
            title={commendation ? "What the passenger said" : "What the passenger reported"}
            icon={<DescriptionRoundedIcon fontSize="small" />}
          >
            <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>
              {r.description}
            </Typography>
            <Box
              sx={{
                mt: 3,
                pt: 2,
                borderTop: 1,
                borderColor: "divider",
                display: "grid",
                gridTemplateColumns: { sm: "1fr 1fr" },
                columnGap: 4,
              }}
            >
              <DetailRow label="Bus number">{r.busNumber}</DetailRow>
              <DetailRow label="Route">{r.routeNumber}</DetailRow>
              {r.busName && <DetailRow label="Bus name">{r.busName}</DetailRow>}
              <DetailRow label="Category">{categoryLabel(r.category)}</DetailRow>
              <DetailRow label="Location">{r.location || "Not given"}</DetailRow>
              {r.incidentAt && (
                <DetailRow label="Incident time">{formatDateTime(r.incidentAt)}</DetailRow>
              )}
              <DetailRow label="Reported">{formatDateTime(r.reportedAt)}</DetailRow>
            </Box>
            {r.confirmations > 0 && (
              <Alert severity="info" icon={<GroupsRoundedIcon />} sx={{ mt: 2 }}>
                {r.confirmations} other passenger{r.confirmations === 1 ? "" : "s"} confirmed seeing
                the same incident.
              </Alert>
            )}
          </SectionPanel>

          <SectionPanel
            title="Your response"
            subtitle="Tell the passenger what you did. They see it on their tracking page with your company name."
            icon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
          >
            {r.responses.length > 0 && (
              <Box sx={{ display: "grid", gap: 1.5, mb: 3 }}>
                {r.responses.map((response) => (
                  <Box
                    key={response.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      opacity: response.hidden ? 0.7 : 1,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(response.createdAt)}
                      </Typography>
                      {response.hidden && (
                        <Chip
                          size="small"
                          icon={<VisibilityOffRoundedIcon />}
                          label="Hidden by the BusWatch team"
                        />
                      )}
                    </Box>
                    <Typography sx={{ whiteSpace: "pre-line", mt: 0.5 }}>
                      {response.body}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 1.5 }}>
              {respond.error && (
                <Alert severity="error">
                  {errorMessage(respond.error, "Could not publish your response.")}
                </Alert>
              )}
              <TextField
                multiline
                minRows={4}
                required
                label={r.responses.length ? "Add an update" : "What did you do about it?"}
                placeholder="e.g. We spoke to the driver, checked the CCTV and arranged extra training."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                helperText={`Keep it factual and polite. Don't name staff or passengers. ${body.length} / ${MAX_RESPONSE}`}
                slotProps={{ htmlInput: { maxLength: MAX_RESPONSE } }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <GradientButton
                  type="submit"
                  loading={respond.isPending}
                  disabled={!body.trim()}
                  endIcon={<SendRoundedIcon />}
                >
                  Publish response
                </GradientButton>
              </Box>
            </Box>
          </SectionPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionPanel title="Progress" icon={<HistoryRoundedIcon fontSize="small" />}>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {[...r.timeline].reverse().map((entry, index) => (
                <Box key={`${entry.status}-${entry.changedAt}-${index}`}>
                  <Typography sx={{ fontWeight: 600 }}>{statusLabel(entry.status)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(entry.changedAt)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </SectionPanel>
        </Grid>
      </Grid>
    </>
  );
}

export default OperatorReportView;
