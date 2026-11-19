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
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Collapse,
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
import { findSimilarReports } from "@/api/reportApi";
import { GradientButton } from "@/components/atoms";
import {
  CategoryPicker,
  ChoiceChips,
  DetailRow,
  EmergencyBanner,
  LocationPicker,
  MediaDropzone,
  PhoneField,
} from "@/components/molecules";
import type { LatLng } from "@/components/molecules/LocationPicker";
import {
  ConfirmedPanel,
  FareChecker,
  MeTooDialog,
  QueuedPanel,
  SubmittedPanel,
  type Receipt,
} from "@/components/organisms";
import {
  ACCESSIBILITY_ISSUES,
  CATEGORIES,
  type AccessibilityIssue,
  type ComplaintCategory,
  type Language,
} from "@/constants/reportConstants";
import useEmergencyCheck from "@/hooks/useEmergencyCheck";
import { parseFareParams } from "@/lib/fareLink";
import type { FareCheckResult, FareSelection } from "@/types/fare";
import { useSmsAvailable } from "@/hooks/useContactChannels";
import useFormDraft from "@/hooks/useFormDraft";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { busQuery, isNewQrScan, parseBusNumber, parseRoute } from "@/lib/busNumber";
import { submitOrQueue } from "@/lib/offlineSubmit";
import { REPORT_DRAFT_KEY as DRAFT_KEY } from "@/lib/reportDraft";
import { rememberReceipt } from "@/lib/trackingHistory";
import type { ReportDetailsInput, SimilarReport } from "@/types/report";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // Must match the backend upload limit
const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;
const MAX_DESCRIPTION = 2000;

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
  /** Accessibility complaints: what went wrong */
  accessibility?: AccessibilityIssue[];
  /** Overcharging complaints: the fare check to attach */
  fare?: FareSelection | null;
}

const isComplaintCategory = (value: string | null): value is ComplaintCategory =>
  CATEGORIES.some((c) => c.value === value);

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

type Result = { kind: "sent"; receipt: Receipt } | { kind: "queued" } | { kind: "confirmed" };

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
  // No phone field when no SMS gateway is set up: there would be nothing to send to it
  const smsAvailable = useSmsAvailable();
  const tc = useTranslations("common");
  const tCategory = useTranslations("categories");
  const tMedia = useTranslations("media");
  const tIssue = useTranslations("accessibilityIssues");
  const locale = useLocale() as Language;
  const online = useOnlineStatus();

  // Opened from the QR sticker inside a bus (/r/NB-1234 → ?bus=NB-1234&src=qr)
  const searchParams = useSearchParams();
  const qrBus = parseBusNumber(searchParams.get("bus"));
  const qrRoute = parseRoute(searchParams.get("route"));
  const fromQr = searchParams.get("src") === "qr";
  // From the fare checker: an overcharging complaint with the fare check filled in
  const linkedCategory = searchParams.get("category");
  const linkedFare = useMemo(() => parseFareParams(searchParams), [searchParams]);
  const prefilled = {
    ...EMPTY_FORM,
    busNumber: qrBus,
    routeNumber: qrRoute,
    category: isComplaintCategory(linkedCategory) ? linkedCategory : ("" as const),
  };

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ReportForm>(prefilled);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [source, setSource] = useState<"web" | "qr">(fromQr ? "qr" : "web");
  const [categoryError, setCategoryError] = useState(false);
  const [accessibility, setAccessibility] = useState<AccessibilityIssue[]>([]);
  const [accessibilityError, setAccessibilityError] = useState(false);
  const [fare, setFare] = useState<FareSelection | null>(linkedFare);
  const [fareResult, setFareResult] = useState<FareCheckResult | null>(null);
  const [fareOpen, setFareOpen] = useState(Boolean(linkedFare));
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  // "Me too": reports about the same bus, category and day, offered before the evidence step
  const [similar, setSimilar] = useState<SimilarReport[] | null>(null);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const declinedSimilar = useRef("");

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

  const emergency = useEmergencyCheck(formData.description, locale);

  const draft = useMemo<Draft>(
    () => ({ form: formData, coords, images, videos, step, source, accessibility, fare }),
    [formData, coords, images, videos, step, source, accessibility, fare],
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
      setAccessibility(saved.accessibility ?? []);
      if (!linkedFare) setFare(saved.fare ?? null);
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

  /** Extras for this category: the accessibility checklist or the fare check */
  const details = (): ReportDetailsInput | null => {
    if (formData.category === "accessibility") return { accessibility };
    if (formData.category === "overcharging" && fare && fareResult) return { fare };
    return null;
  };

  const send = async () => {
    setSubmitting(true);
    setErrorText("");
    const extras = details();
    try {
      const outcome = await submitOrQueue(
        {
          ...formData,
          type: "complaint",
          ...(extras && { details: JSON.stringify(extras) }),
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

  const similarKey = `${formData.busNumber}|${formData.category}|${formData.incidentAt}`;

  /** After "What happened": did other passengers already report this bus for the same thing? */
  const checkSimilar = async () => {
    if (!online || !formData.category || declinedSimilar.current === similarKey) {
      goTo(2);
      return;
    }
    setCheckingSimilar(true);
    let matches: SimilarReport[] = [];
    try {
      ({ matches } = await findSimilarReports({
        busNumber: formData.busNumber,
        category: formData.category,
        at: formData.incidentAt ? new Date(formData.incidentAt).toISOString() : undefined,
      }));
    } catch {
      // Best-effort: never stop a passenger from reporting
    } finally {
      setCheckingSimilar(false);
    }
    if (matches.length) {
      trackEvent("confirmation_offered");
      setSimilar(matches);
    } else {
      goTo(2);
    }
  };

  const declineSimilar = () => {
    declinedSimilar.current = similarKey;
    setSimilar(null);
    goTo(2);
  };

  const confirmedSimilar = () => {
    setSimilar(null);
    void discard();
    setResult({ kind: "confirmed" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Each step is its own <form>, so the browser checks required fields before moving on
  const handleStepSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 0 && !formData.category) {
      setCategoryError(true);
      return;
    }
    if (step === 1 && formData.category === "accessibility" && !accessibility.length) {
      setAccessibilityError(true);
      return;
    }
    if (step === 1) void checkSimilar();
    else if (step < STEPS.length - 1) goTo(step + 1);
    else void send();
  };

  const reset = () => {
    void discard();
    setFormData(prefilled);
    setCoords(null);
    setImages([]);
    setVideos([]);
    setResult(null);
    setSimilar(null);
    setAccessibility([]);
    setFare(null);
    setFareResult(null);
    declinedSimilar.current = "";
    setStep(0);
    started.current = false;
  };

  if (result?.kind === "sent") {
    return <SubmittedPanel receipt={result.receipt} type="complaint" onReset={reset} />;
  }
  if (result?.kind === "queued") return <QueuedPanel type="complaint" onReset={reset} />;
  if (result?.kind === "confirmed") {
    return <ConfirmedPanel busNumber={formData.busNumber} onReset={reset} />;
  }

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
      {formData.category === "harassment" && (
        <Alert
          severity="info"
          icon={<ShieldRoundedIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              href={`/safety${busQuery(formData.busNumber, formData.routeNumber)}`}
            >
              {t("safetyOpen")}
            </Button>
          }
        >
          {t("safetyHint")}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary">
        {t.rich("commendInstead", {
          link: (chunks) => <Link href={commendHref}>{chunks}</Link>,
        })}
      </Typography>
    </Box>,

    // 1: What happened
    <Box key="incident" sx={{ display: "grid", gap: 2.5 }}>
      {formData.category === "accessibility" && (
        <ChoiceChips
          required
          label={t("accessibilityQuestion")}
          options={ACCESSIBILITY_ISSUES.map((i) => ({
            value: i.value,
            label: tIssue(i.value),
          }))}
          value={accessibility}
          onChange={(issues) => {
            setAccessibility(issues);
            setAccessibilityError(false);
          }}
          error={accessibilityError ? t("accessibilityRequired") : undefined}
        />
      )}
      {formData.category === "overcharging" && (
        <Box sx={{ borderRadius: 3, border: 1, borderColor: "divider", p: 2 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}
          >
            <Box>
              <Typography variant="subtitle2">{t("fareTitle")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {fareResult ? t("fareAttached", { fare: fareResult.officialFare }) : t("fareHint")}
              </Typography>
            </Box>
            {!fareOpen && (
              <Button startIcon={<PaymentsRoundedIcon />} onClick={() => setFareOpen(true)}>
                {t("fareOpen")}
              </Button>
            )}
          </Box>
          <Collapse in={fareOpen} unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <FareChecker
                routeNumber={formData.routeNumber}
                initial={fare ?? undefined}
                onResult={(selection, checked) => {
                  setFare(selection);
                  setFareResult(checked);
                }}
              />
            </Box>
          </Collapse>
        </Box>
      )}
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
      {smsAvailable && (
        <PhoneField
          name="passengerPhone"
          label={t("phone")}
          helperText={t("phoneHelp")}
          invalidText={t("phoneInvalid")}
          value={formData.passengerPhone}
          onChange={handleChange}
        />
      )}
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
          {formData.category === "accessibility" &&
            accessibility.length > 0 &&
            `: ${accessibility.map((i) => tIssue(i)).join(", ")}`}
        </DetailRow>
        {formData.category === "overcharging" && fareResult && (
          <DetailRow label={t("reviewFare")}>
            {t("reviewFareValue", {
              official: fareResult.officialFare,
              charged: fareResult.chargedFare ?? "-",
            })}
          </DetailRow>
        )}
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
          <Box
            sx={{
              position: { md: "sticky" },
              top: { md: 104 },
              p: { xs: 2.5, md: 3.5 },
              borderRadius: { xs: "22px", md: "28px" },
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: "var(--bw-shadow-card)",
              backgroundImage:
                "radial-gradient(120% 60% at 0% 0%, rgba(var(--mui-palette-primary-mainChannel) / 0.12), transparent 60%)",
            }}
          >
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
            {emergency.kind && (
              <EmergencyBanner kind={emergency.kind} onDismiss={emergency.dismiss} />
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
                  loading={submitting || checkingSimilar}
                  endIcon={last ? <TaskAltRoundedIcon /> : <ArrowForwardRoundedIcon />}
                >
                  {last ? t("send") : tc("continue")}
                </GradientButton>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {similar && formData.category && (
        <MeTooDialog
          matches={similar}
          busNumber={formData.busNumber.toUpperCase()}
          categoryLabel={tCategory(formData.category)}
          description={formData.description}
          language={locale}
          source={source}
          website={formData.website}
          onConfirmed={confirmedSimilar}
          onDecline={declineSimilar}
        />
      )}

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
