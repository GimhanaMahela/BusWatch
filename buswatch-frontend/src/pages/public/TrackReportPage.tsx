import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { ApiError, errorMessage } from "../../api/apiClient";
import { useTrackedReport } from "../../hooks/useReportQueries";
import type { ReportStatus } from "../../constants/reportConstants";
import { categoryLabel, statusLabel } from "../../constants/reportConstants";
import { StatusChip } from "../../components/atoms";
import { DetailRow } from "../../components/molecules";

const STATUS_DESCRIPTIONS: Record<ReportStatus, string> = {
  pending: "We've received your report and it is waiting to be reviewed.",
  reviewed: "Our team has reviewed your report.",
  escalated: "Your report has been passed on to the bus operator or authorities.",
  resolved: "Action has been taken on your report.",
  rejected: "This report was closed without further action.",
};

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

function TrackReportPage() {
  const { receiptId: receiptIdParam } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(receiptIdParam || "");
  const { data: report, error: lookupError, isFetching: loading, refetch } =
    useTrackedReport(receiptIdParam);

  // The URL is the source of truth, so a tracking link can be shared or bookmarked.
  // When it changes (e.g. browser back), show that ID in the search box.
  const [shownParam, setShownParam] = useState(receiptIdParam);
  if (receiptIdParam !== shownParam) {
    setShownParam(receiptIdParam);
    setInput(receiptIdParam ?? "");
  }

  const error = lookupError
    ? lookupError instanceof ApiError && lookupError.status === 404
      ? "We couldn't find a report with that Receipt ID. Check it and try again."
      : errorMessage(lookupError, "Something went wrong. Please try again.")
    : "";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = input.trim();
    if (!id) return;
    if (id === receiptIdParam) {
      void refetch();
    } else {
      void navigate(`/track/${encodeURIComponent(id)}`);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
        Track Your Report
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Enter the Receipt ID you received after submitting a report.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          label="Receipt ID"
          placeholder="BW-2026-XXXXXX"
          value={input}
          onChange={(e) => setInput(e.target.value)}
 slotProps={{ input: { startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ) } }}
/>
        <Button type="submit" variant="contained" disabled={loading || !input.trim()}>
          Track
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {report && !loading && (
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }} elevation={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
              {report.receiptId}
            </Typography>
            <StatusChip status={report.status} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {STATUS_DESCRIPTIONS[report.status]}
          </Typography>

          <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: "divider", py: 1, mb: 3 }}>
            <DetailRow label="Category">{categoryLabel(report.category)}</DetailRow>
            <DetailRow label="Bus">
              {report.busNumber} · Route {report.routeNumber}
            </DetailRow>
            <DetailRow label="Location">{report.location}</DetailRow>
            {report.incidentAt && (
              <DetailRow label="Incident time">{formatDate(report.incidentAt)}</DetailRow>
            )}
            <DetailRow label="Submitted">{formatDate(report.reportedAt)}</DetailRow>
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Timeline
          </Typography>
          <Stepper orientation="vertical" activeStep={report.timeline.length}>
            {report.timeline.map((entry, index) => (
              <Step key={index} completed expanded>
                <StepLabel optional={
                  entry.changedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.changedAt)}
                    </Typography>
                  )
                }>
                  {statusLabel(entry.status)}
                </StepLabel>
                <StepContent>
                  {entry.note && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                      {entry.note}
                    </Typography>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}
    </Container>
  );
}

export default TrackReportPage;
