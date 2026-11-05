"use client";

import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import CommuteRoundedIcon from "@mui/icons-material/CommuteRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { toApiError } from "@/api/apiClient";
import { trackEvent } from "@/api/metricsApi";
import { GradientButton } from "@/components/atoms";
import {
  CategoryPicker,
  DetailRow,
  LocationPicker,
  MediaDropzone,
  PhoneField,
} from "@/components/molecules";
import type { LatLng } from "@/components/molecules/LocationPicker";
import { QueuedPanel, SubmittedPanel, type Receipt } from "@/components/organisms";
import { CATEGORIES, type ComplaintCategory, type Language } from "@/constants/reportConstants";
import useFormDraft from "@/hooks/useFormDraft";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { busQuery, isNewQrScan, parseBusNumber, parseRoute } from "@/lib/busNumber";
import { submitOrQueue } from "@/lib/offlineSubmit";
import { rememberReceipt } from "@/lib/trackingHistory";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // Must match the backend upload limit
const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;
const MAX_DESCRIPTION = 2000;
const DRAFT_KEY = "submit-report";

interface ReportForm {
  busNumber: string;
  routeNumber: string;
  busName: string;
  category: ComplaintCategory | "";
  incidentAt: string;
  location: string;
  description: string;
  passengerEmail: string;
  passengerPhone: string;
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
  passengerPhone: "",
  website: "", // Honeypot: hidden from people, bots tend to fill it in
};

interface Draft {
  form: ReportForm;
  coords: LatLng | null;
  images: File[];
  videos: File[];
  step: number;
  source: "web" | "qr";
}

// A bus and route number alone (e.g. pre-filled from a QR code) isn't worth restoring later
const isEmptyDraft = ({ form, images, videos, coords }: Draft) =>
  !form.category &&
  !form.description.trim() &&
  !form.location.trim() &&
  !form.incidentAt &&
  !form.passengerEmail.trim() &&
  !form.passengerPhone.trim() &&
  !coords &&
  images.length === 0 &&
  videos.length === 0;

const STEPS = [
  { label: "stepBus", hint: "stepBusHint" },
  { label: "stepIncident", hint: "stepIncidentHint" },
  { label: "stepEvidence", hint: "stepEvidenceHint" },
  { label: "stepReview", hint: "stepReviewHint" },
] as const;

type Result = { kind: "sent"; receipt: Receipt } | { kind: "queued" };

// Value for <input type="datetime-local" max=...> in the user's local time
const nowForDateTimeInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const startIcon = (icon: ReactNode) => ({
  input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> },
});

function SubmitReportView() {
  const t = useTranslations("submit");
  const tc = useTranslations("common");
  const tCategory = useTranslations("categories");
  const tMedia = useTranslations("media");
  const locale = useLocale() as Language;
  const online = useOnlineStatus();

  // Opened from the QR sticker inside a bus (/r/NB-1234 → ?bus=NB-1234&src=qr)
  const searchParams = useSearchParams();
  const qrBus = parseBusNumber(searchParams.get("bus"));
  const qrRoute = parseRoute(searchParams.get("route"));
  const fromQr = searchParams.get("src") === "qr";
  const prefilled = { ...EMPTY_FORM, busNumber: qrBus, routeNumber: qrRoute };

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ReportForm>(prefilled);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [source, setSource] = useState<"web" | "qr">(fromQr ? "qr" : "web");
  const [categoryError, setCategoryError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  // Success metrics: QR scans, and how many people start the form (vs. finish it)
  const started = useRef(false);
  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("report_form_started");
  };
  // Once per bus per session, so switching between the report and commend forms counts once
  useEffect(() => {
    if (fromQr && qrBus && isNewQrScan(qrBus)) trackEvent("qr_scan");
  }, [fromQr, qrBus]);

  const draft = useMemo<Draft>(
    () => ({ form: formData, coords, images, videos, step, source }),
    [formData, coords, images, videos, step, source],
  );
  const {
    restoredAt,
    discard,
    dismissNotice: dismissDraftNotice,
  } = useFormDraft<Draft>({
    key: DRAFT_KEY,
    value: draft,
    isEmpty: isEmptyDraft,
    onRestore: (saved) => {
      // Scanning the sticker in a different bus starts a fresh report
      if (qrBus && saved.form.busNumber && saved.form.busNumber !== qrBus) return false;
      setFormData({ ...EMPTY_FORM, ...saved.form, busNumber: saved.form.busNumber || qrBus });
      setCoords(saved.coords);
      setImages(saved.images);
      setVideos(saved.videos);
      setStep(Math.min(Math.max(saved.step, 0), STEPS.length - 1));
      setSource(fromQr ? "qr" : saved.source);
      started.current = true; // a restored draft was already counted as started
      return true;
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    markStarted();
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
      const outcome = await submitOrQueue(
        {
          ...formData,
          type: "complaint",
          // datetime-local has no timezone; send an unambiguous ISO timestamp
          incidentAt: formData.incidentAt ? new Date(formData.incidentAt).toISOString() : "",
          latitude: coords ? coords.lat : "",
          longitude: coords ? coords.lng : "",
          language: locale,
          source,
        },
        images,
        videos,
      );
      await discard();
      if (outcome.kind === "sent") {
        const { receiptId, pdfUrl, emailSent, smsSent } = outcome.response;
        rememberReceipt(receiptId);
        setResult({
          kind: "sent",
          receipt: { receiptId, pdfUrl, emailSent: Boolean(emailSent), smsSent: Boolean(smsSent) },
        });
      } else {
        setResult({ kind: "queued" });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      const error = toApiError(caught);
      setErrorText(error.errors?.join(" ") || error.message || t("failed"));
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
    void discard();
    setFormData(prefilled);
    setCoords(null);
    setImages([]);
    setVideos([]);
    setResult(null);
    setStep(0);
    started.current = false;
  };

  if (result?.kind === "sent") {
    return <SubmittedPanel receipt={result.receipt} type="complaint" onReset={reset} />;
  }
  if (result?.kind === "queued") return <QueuedPanel type="complaint" onReset={reset} />;

  const commendHref = `/commend-a-driver${busQuery(formData.busNumber || qrBus, formData.routeNumber, fromQr ? "qr" : undefined)}`;

  const stepContent = [
    // 0: The bus
    <Box key="bus" sx={{ display: "grid", gap: 2.5 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            autoFocus={!qrBus}
            label={t("busNumber")}
            placeholder="NE-9999"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            slotProps={{
              ...startIcon(<DirectionsBusRoundedIcon color="action" />),
              htmlInput: { maxLength: 20 },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            autoFocus={Boolean(qrBus)}
            label={t("route")}
            placeholder={t("routePlaceholder")}
            name="routeNumber"
            value={formData.routeNumber}
            onChange={handleChange}
            slotProps={{
              ...startIcon(<AltRouteRoundedIcon color="action" />),
              htmlInput: { maxLength: 60 },
            }}
          />
        </Grid>
      </Grid>
      <TextField
        fullWidth
        label={t("busName")}
        placeholder="Nuwantha Express"
        name="busName"
        value={formData.busName}
        onChange={handleChange}
        slotProps={startIcon(<CommuteRoundedIcon color="action" />)}
      />
      <CategoryPicker
        label={t("categoryQuestion")}
        options={CATEGORIES.map((c) => ({ value: c.value, label: tCategory(c.value) }))}
        value={formData.category}
        onChange={(category) => {
          markStarted();
          setFormData({ ...formData, category });
          setCategoryError(false);
        }}
        error={categoryError ? t("chooseCategory") : undefined}
      />
      <Typography variant="body2" color="text.secondary">
        {t.rich("commendInstead", {
          link: (chunks) => <Link href={commendHref}>{chunks}</Link>,
        })}
      </Typography>
    </Box>,

    // 1: What happened
    <Box key="incident" sx={{ display: "grid", gap: 2.5 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="datetime-local"
            label={t("when")}
            name="incidentAt"
            value={formData.incidentAt}
            onChange={handleChange}
            helperText={t("whenHelp")}
            slotProps={{ htmlInput: { max: nowForDateTimeInput() }, inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label={t("where")}
            placeholder={t("wherePlaceholder")}
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
        label={t("description")}
        placeholder={t("descriptionPlaceholder")}
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
        label={tMedia("addPhotos")}
        files={images}
        onChange={setImages}
        max={MAX_IMAGES}
        maxBytes={MAX_FILE_BYTES}
        onReject={setErrorText}
      />
      <MediaDropzone
        kind="video"
        label={tMedia("addVideos")}
        files={videos}
        onChange={setVideos}
        max={MAX_VIDEOS}
        maxBytes={MAX_FILE_BYTES}
        onReject={setErrorText}
      />
      <TextField
        fullWidth
        type="email"
        label={t("email")}
        name="passengerEmail"
        value={formData.passengerEmail}
        onChange={handleChange}
        helperText={t("emailHelp")}
        slotProps={startIcon(<EmailRoundedIcon color="action" />)}
      />
      <PhoneField
        name="passengerPhone"
        label={t("phone")}
        helperText={t("phoneHelp")}
        invalidText={t("phoneInvalid")}
        value={formData.passengerPhone}
        onChange={handleChange}
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
        <DetailRow label={t("reviewBus")}>
          {formData.busNumber}
          {formData.busName && ` · ${formData.busName}`}
        </DetailRow>
        <DetailRow label={t("reviewRoute")}>{formData.routeNumber}</DetailRow>
        <DetailRow label={t("reviewCategory")}>
          {formData.category ? tCategory(formData.category) : ""}
        </DetailRow>
        <DetailRow label={t("reviewWhen")}>
          {formData.incidentAt ? new Date(formData.incidentAt).toLocaleString() : t("justNow")}
        </DetailRow>
        <DetailRow label={t("reviewWhere")}>
          {formData.location}
          {coords && ` ${t("mapPinAttached")}`}
        </DetailRow>
        <DetailRow label={t("reviewEvidence")}>
          {t("evidenceCount", { photos: images.length, videos: videos.length })}
        </DetailRow>
        <DetailRow label={t("reviewEmail")}>{formData.passengerEmail || t("none")}</DetailRow>
        <DetailRow label={t("reviewPhone")}>{formData.passengerPhone || t("none")}</DetailRow>
      </Box>
      <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 0.5 }}>
        {t("reviewDescription")}
      </Typography>
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
        {formData.description}
      </Typography>
      <Alert severity="info" icon={<LockRoundedIcon />} sx={{ mt: 3 }}>
        {t.rich("consent", {
          terms: (chunks) => <Link href="/terms-of-service">{chunks}</Link>,
          privacy: (chunks) => <Link href="/privacy-policy">{chunks}</Link>,
        })}
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
              {t("eyebrow")}
            </Typography>
            <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.4rem" } }}>
              {t("title")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              {t("subtitle")}
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
                        {t(s.hint)}
                      </Typography>
                    }
                  >
                    {t(s.label)}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "grid", gap: 1.5, mb: 2, "&:empty": { display: "none" } }}>
            {!online && (
              <Alert severity="warning" icon={<CloudOffRoundedIcon />}>
                {t("offlineBanner")}
              </Alert>
            )}
            {restoredAt && (
              <Alert
                severity="info"
                icon={<HistoryRoundedIcon />}
                onClose={dismissDraftNotice}
                action={
                  <Button color="inherit" size="small" onClick={reset}>
                    {t("discardDraft")}
                  </Button>
                }
              >
                {t("draftRestored")}
              </Alert>
            )}
            {fromQr && qrBus && step === 0 && !restoredAt && (
              <Alert severity="success" icon={<QrCode2RoundedIcon />}>
                {t("qrBanner", { bus: qrBus })}
              </Alert>
            )}
          </Box>
          <Card sx={{ overflow: "hidden" }}>
            <LinearProgress
              variant="determinate"
              value={((step + 1) / STEPS.length) * 100}
              sx={{ height: 4 }}
            />
            <Box component="form" onSubmit={handleStepSubmit} sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t("stepOf", { current: step + 1, total: STEPS.length })}
              </Typography>
              <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                {t(STEPS[step]?.label ?? "stepBus")}
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
                  {tc("back")}
                </Button>
                <GradientButton
                  type="submit"
                  size="large"
                  loading={submitting}
                  endIcon={last ? <TaskAltRoundedIcon /> : <ArrowForwardRoundedIcon />}
                >
                  {last ? t("send") : tc("continue")}
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
