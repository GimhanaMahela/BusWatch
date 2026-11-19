"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { Alert, Box, Button, Card, Chip, Grid, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/api/apiClient";
import { GradientButton, StatusChip } from "@/components/atoms";
import { DetailRow, EmptyState, LoadingState, SectionPanel } from "@/components/molecules";
import { accessibilityLabel, categoryLabel, statusLabel } from "@/constants/reportConstants";
import { useFleetReport, useRespondToReport } from "@/hooks/useOperatorQueries";
import { formatDateTime, timeAgo } from "@/lib/format";

const MAX_RESPONSE = 2000; // Must match MAX_OPERATOR_RESPONSE_LENGTH in the API

function OperatorReportView({ id }: { id: string }) {
  const report = useFleetReport(id);
  const respond = useRespondToReport(id);
  const markFound = useRespondToReport(id, true);
  const [body, setBody] = useState("");
  const [foundBody, setFoundBody] = useState("");

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
  const lost = r.type === "lost_item";
  const details = r.details;

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
        {lost && (
          <Chip
            icon={<TravelExploreRoundedIcon />}
            label={r.status === "resolved" ? "Lost item · found" : "Lost item"}
            color="info"
            variant="outlined"
            size="small"
          />
        )}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {categoryLabel(r.category)} · reported {timeAgo(r.reportedAt)}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }} sx={{ display: "grid", gap: 3, alignContent: "start" }}>
          <SectionPanel
            title={
              commendation
                ? "What the passenger said"
                : lost
                  ? "What the passenger lost"
                  : "What the passenger reported"
            }
            icon={<DescriptionRoundedIcon fontSize="small" />}
          >
            <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>
              {r.description}
            </Typography>
            {r.translation && (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
                <Typography variant="caption" color="text.secondary">
                  English translation (automatic)
                </Typography>
                <Typography sx={{ whiteSpace: "pre-line" }}>{r.translation}</Typography>
              </Box>
            )}
            {r.images.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                {r.images.map((url, index) => (
                  <Box
                    key={url}
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ width: 120, height: 90, borderRadius: 2, overflow: "hidden" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary photo */}
                    <img
                      src={url}
                      alt={`Photo ${index + 1} (faces and number plates blurred)`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ))}
              </Box>
            )}
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
              {details?.accessibility && (
                <DetailRow label="Accessibility issues">
                  {details.accessibility.map(accessibilityLabel).join(", ")}
                </DetailRow>
              )}
              {details?.fare && (
                <DetailRow label="Official fare">
                  Rs. {details.fare.officialFare} ({details.fare.from} → {details.fare.to})
                  {details.fare.chargedFare !== null &&
                    `, passenger says they paid Rs. ${details.fare.chargedFare}`}
                </DetailRow>
              )}
              <DetailRow label={lost ? "Got off at" : "Location"}>
                {r.location || "Not given"}
              </DetailRow>
              {r.incidentAt && (
                <DetailRow label={lost ? "On the bus at" : "Incident time"}>
                  {formatDateTime(r.incidentAt)}
                </DetailRow>
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

          {lost && r.status !== "resolved" && (
            <SectionPanel
              title="Found it?"
              subtitle="Say where and when the passenger can collect it. We tell them straight away by email, SMS or WhatsApp, and close the report."
              icon={<TravelExploreRoundedIcon fontSize="small" />}
            >
              <Box
                component="form"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  markFound.mutate(foundBody, { onSuccess: () => setFoundBody("") });
                }}
                sx={{ display: "grid", gap: 1.5 }}
              >
                {markFound.error && (
                  <Alert severity="error">
                    {errorMessage(markFound.error, "Could not mark it as found.")}
                  </Alert>
                )}
                <TextField
                  multiline
                  minRows={3}
                  required
                  label="Where can they collect it?"
                  placeholder="e.g. Found by the conductor. Collect from the Kadawatha depot office, 8am to 5pm, with ID."
                  value={foundBody}
                  onChange={(e) => setFoundBody(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: MAX_RESPONSE } }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    loading={markFound.isPending}
                    disabled={!foundBody.trim()}
                    startIcon={<CheckCircleRoundedIcon />}
                  >
                    We found it
                  </Button>
                </Box>
              </Box>
            </SectionPanel>
          )}

          <SectionPanel
            title={lost ? "Updates for the passenger" : "Your response"}
            subtitle={
              lost
                ? "Not found yet, or need a detail? Write here: the passenger is told straight away."
                : "Tell the passenger what you did. They see it on their tracking page with your company name."
            }
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
