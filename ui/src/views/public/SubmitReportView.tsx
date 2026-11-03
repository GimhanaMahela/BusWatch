"use client";

import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CommuteRoundedIcon from "@mui/icons-material/CommuteRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toApiError } from "@/api/apiClient";
import { submitReport } from "@/api/reportApi";
import { GradientButton } from "@/components/atoms";
import { DetailRow, LocationPicker, MediaDropzone } from "@/components/molecules";
import type { LatLng } from "@/components/molecules/LocationPicker";
import { CATEGORIES, categoryLabel, type ReportCategory } from "@/constants/reportConstants";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // Must match the backend upload limit
const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;
const MAX_DESCRIPTION = 2000;

interface ReportForm {
  busNumber: string;
  routeNumber: string;
  busName: string;
  category: ReportCategory | "";
  incidentAt: string;
  location: string;
  description: string;
  passengerEmail: string;
  website: string;
}

const EMPTY_FORM: ReportForm = {
  busNumber: "",
  routeNumber: "",
  busName: "",
  category: "",
  incidentAt: "",
  location: "",
  description: "",
  passengerEmail: "",
  website: "", // Honeypot: hidden from people, bots tend to fill it in
};

const STEPS = [
  { label: "The bus", hint: "Which bus, and what kind of incident" },
  { label: "What happened", hint: "When, where and the details" },
  { label: "Evidence", hint: "Photos, videos and your email" },
  { label: "Review", hint: "Check and send" },
];

interface Receipt {
  receiptId: string;
  pdfUrl: string | null;
  emailSent: boolean;
}

// Value for <input type="datetime-local" max=...> in the user's local time
const nowForDateTimeInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const startIcon = (icon: ReactNode) => ({
  input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> },
});

function SuccessPanel({ receipt, onReset }: { receipt: Receipt; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(receipt.receiptId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the ID is still on screen to copy by hand
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Card sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            mx: "auto",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "success.main",
            bgcolor: "rgba(var(--mui-palette-success-mainChannel) / 0.12)",
          }}
        >
          <TaskAltRoundedIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ mt: 3 }}>
          Report received. Thank you.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Save your receipt ID to check on your report later.
          {receipt.emailSent && " We've also emailed you a copy."}
        </Typography>

        <Box
          sx={{
            mt: 4,
            p: 2.5,
            borderRadius: 4,
            border: "2px dashed",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 800,
              fontSize: { xs: "1.4rem", sm: "1.8rem" },
              letterSpacing: 1,
            }}
          >
            {receipt.receiptId}
          </Typography>
          <Tooltip title={copied ? "Copied!" : "Copy receipt ID"}>
            <IconButton aria-label="Copy receipt ID" onClick={() => void copy()}>
              {copied ? <CheckRoundedIcon color="success" /> : <ContentCopyRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mt: 4, justifyContent: "center", flexWrap: "wrap" }}>
          <GradientButton href={`/track/${encodeURIComponent(receipt.receiptId)}`} size="large">
            Track this report
          </GradientButton>
          {receipt.pdfUrl && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<DownloadRoundedIcon />}
              href={receipt.pdfUrl}
              download={`BusWatch_Receipt_${receipt.receiptId}.pdf`}
              target="_blank"
              rel="noopener"
            >
              Receipt PDF
            </Button>
          )}
        </Box>
        <Button onClick={onReset} sx={{ mt: 2 }}>
          Report another incident
        </Button>
      </Card>
    </Container>
  );
}

function SubmitReportView() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const send = async () => {
    setSubmitting(true);
    setErrorText("");
    try {
      const data = await submitReport(
        {
          ...formData,
          // datetime-local has no timezone; send an unambiguous ISO timestamp
          incidentAt: formData.incidentAt ? new Date(formData.incidentAt).toISOString() : "",
          latitude: coords ? coords.lat : "",
          longitude: coords ? coords.lng : "",
        },
        images,
        videos,
      );
      setReceipt({
        receiptId: data.receiptId,
        pdfUrl: data.pdfUrl,
        emailSent: Boolean(data.emailSent),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      const error = toApiError(caught);
      setErrorText(
        (error.errors && error.errors.join(" ")) ||
          error.message ||
          "Failed to submit report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Each step is its own <form>, so the browser checks required fields before moving on
  const handleStepSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 0 && !formData.category) {
      setCategoryError(true);
      return;
    }
    if (step < STEPS.length - 1) goTo(step + 1);
    else void send();
  };

  const reset = () => {
    setFormData(EMPTY_FORM);
    setCoords(null);
    setImages([]);
    setVideos([]);
    setReceipt(null);
    setStep(0);
  };

  if (receipt) return <SuccessPanel receipt={receipt} onReset={reset} />;

  const stepContent = [
    // 0: The bus
    <Box key="bus" sx={{ display: "grid", gap: 2.5 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            autoFocus
            label="Bus number"
            placeholder="NE-9999"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            slotProps={startIcon(<DirectionsBusRoundedIcon color="action" />)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label="Route"
            placeholder="08 or Colombo–Matale"
            name="routeNumber"
            value={formData.routeNumber}
            onChange={handleChange}
            slotProps={startIcon(<AltRouteRoundedIcon color="action" />)}
          />
        </Grid>
      </Grid>
      <TextField
        fullWidth
        label="Bus name (optional)"
        placeholder="Nuwantha Express"
        name="busName"
        value={formData.busName}
        onChange={handleChange}
        slotProps={startIcon(<CommuteRoundedIcon color="action" />)}
      />
      <Box>
        <Typography id="category-label" variant="subtitle2" sx={{ mb: 1 }}>
          What happened? *
        </Typography>
        <Box
          role="radiogroup"
          aria-labelledby="category-label"
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}
        >
          {CATEGORIES.map((c) => {
            const selected = formData.category === c.value;
            return (
              <Box
                key={c.value}
                component="button"
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setFormData({ ...formData, category: c.value });
                  setCategoryError(false);
                }}
                sx={{
                  all: "unset",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1.75,
                  py: 1.4,
                  borderRadius: 2.5,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  border: 1.5,
                  borderStyle: "solid",
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected
                    ? "rgba(var(--mui-palette-primary-mainChannel) / 0.08)"
                    : "background.paper",
                  color: selected ? "primary.main" : "text.primary",
                  transition: "border-color 0.15s, background-color 0.15s",
                  "&:hover": { borderColor: "primary.main" },
                  "&:focus-visible": {
                    outline: "3px solid",
                    outlineColor: "primary.light",
                    outlineOffset: 2,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: 2,
                    borderStyle: "solid",
                    borderColor: selected ? "primary.main" : "text.disabled",
                    display: "grid",
                    placeItems: "center",
                    "&::after": selected
                      ? {
                          content: '""',
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                        }
                      : undefined,
                  }}
                />
                {c.label}
              </Box>
            );
          })}
        </Box>
        {categoryError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }} role="alert">
            Choose the kind of incident.
          </Typography>
        )}
      </Box>
    </Box>,

    // 1: What happened
    <Box key="incident" sx={{ display: "grid", gap: 2.5 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="datetime-local"
            label="When did it happen?"
            name="incidentAt"
            value={formData.incidentAt}
            onChange={handleChange}
            helperText="Leave empty if it just happened"
            slotProps={{ htmlInput: { max: nowForDateTimeInput() }, inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label="Where?"
            placeholder="Ambepussa Junction"
            name="location"
            value={formData.location}
            onChange={handleChange}
            slotProps={startIcon(<LocationOnRoundedIcon color="action" />)}
          />
        </Grid>
      </Grid>
      <LocationPicker value={coords} onChange={setCoords} />
      <TextField
        fullWidth
        required
        multiline
        minRows={5}
        label="Describe what happened"
        placeholder="What did you see? Who was involved? Anything that helps us follow up."
        name="description"
        value={formData.description}
        onChange={handleChange}
        helperText={`${formData.description.length} / ${MAX_DESCRIPTION}`}
        slotProps={{
          htmlInput: { maxLength: MAX_DESCRIPTION },
          formHelperText: { sx: { textAlign: "right" } },
        }}
      />
    </Box>,

    // 2: Evidence and contact
    <Box key="evidence" sx={{ display: "grid", gap: 2.5 }}>
      <MediaDropzone
        kind="image"
        label="Add photos"
        files={images}
        onChange={setImages}
        max={MAX_IMAGES}
        maxBytes={MAX_FILE_BYTES}
        onReject={setErrorText}
      />
      <MediaDropzone
        kind="video"
        label="Add videos"
        files={videos}
        onChange={setVideos}
        max={MAX_VIDEOS}
        maxBytes={MAX_FILE_BYTES}
        onReject={setErrorText}
      />
      <TextField
        fullWidth
        type="email"
        label="Your email (optional)"
        name="passengerEmail"
        value={formData.passengerEmail}
        onChange={handleChange}
        helperText="We'll send your receipt and status updates here. Never shown publicly."
        slotProps={startIcon(<EmailRoundedIcon color="action" />)}
      />
      {/* Honeypot field: invisible to people and screen readers */}
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
      />
    </Box>,

    // 3: Review
    <Box key="review">
      <Box sx={{ borderRadius: 3, border: 1, borderColor: "divider", px: 2, py: 1 }}>
        <DetailRow label="Bus">
          {formData.busNumber}
          {formData.busName && ` · ${formData.busName}`}
        </DetailRow>
        <DetailRow label="Route">{formData.routeNumber}</DetailRow>
        <DetailRow label="Category">{categoryLabel(formData.category)}</DetailRow>
        <DetailRow label="When">
          {formData.incidentAt ? new Date(formData.incidentAt).toLocaleString() : "Just now"}
        </DetailRow>
        <DetailRow label="Where">
          {formData.location}
          {coords && " (map pin attached)"}
        </DetailRow>
        <DetailRow label="Evidence">
          {images.length} photo{images.length === 1 ? "" : "s"}, {videos.length} video
          {videos.length === 1 ? "" : "s"}
        </DetailRow>
        <DetailRow label="Receipt email">{formData.passengerEmail || "None"}</DetailRow>
      </Box>
      <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 0.5 }}>
        Description
      </Typography>
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
        {formData.description}
      </Typography>
      <Alert severity="info" icon={<LockRoundedIcon />} sx={{ mt: 3 }}>
        By sending this report you agree to our <Link href="/terms-of-service">terms</Link> and{" "}
        <Link href="/privacy-policy">privacy policy</Link>.
      </Alert>
    </Box>,
  ];

  const last = step === STEPS.length - 1;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Grid container spacing={{ xs: 3, md: 6 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ position: { md: "sticky" }, top: { md: 104 } }}>
            <Typography variant="overline" color="primary" component="p">
              New report
            </Typography>
            <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.4rem" } }}>
              Report an incident
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              It takes about two minutes. You don&apos;t need an account.
            </Typography>
            <Stepper
              activeStep={step}
              orientation="vertical"
              sx={{ mt: 4, display: { xs: "none", md: "flex" } }}
            >
              {STEPS.map((s) => (
                <Step key={s.label}>
                  <StepLabel
                    optional={
                      <Typography variant="caption" color="text.secondary">
                        {s.hint}
                      </Typography>
                    }
                  >
                    {s.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ overflow: "hidden" }}>
            <LinearProgress
              variant="determinate"
              value={((step + 1) / STEPS.length) * 100}
              sx={{ height: 4 }}
            />
            <Box component="form" onSubmit={handleStepSubmit} sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Step {step + 1} of {STEPS.length}
              </Typography>
              <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                {STEPS[step]?.label}
              </Typography>

              {stepContent[step]}

              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Button
                  onClick={() => goTo(step - 1)}
                  startIcon={<ArrowBackRoundedIcon />}
                  disabled={step === 0 || submitting}
                  sx={{ visibility: step === 0 ? "hidden" : "visible" }}
                >
                  Back
                </Button>
                <GradientButton
                  type="submit"
                  size="large"
                  loading={submitting}
                  endIcon={last ? <TaskAltRoundedIcon /> : <ArrowForwardRoundedIcon />}
                >
                  {last ? "Send report" : "Continue"}
                </GradientButton>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(errorText)}
        autoHideDuration={8000}
        onClose={(_, reason) => reason !== "clickaway" && setErrorText("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorText("")}
          severity="error"
          variant="filled"
          sx={{ width: "100%", maxWidth: 480 }}
        >
          {errorText}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SubmitReportView;
