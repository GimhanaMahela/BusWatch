"use client";

import AirlineSeatReclineNormalRoundedIcon from "@mui/icons-material/AirlineSeatReclineNormalRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Grid,
  InputAdornment,
  Snackbar,
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
import { CategoryPicker, ChoiceCards, PhoneField } from "@/components/molecules";
import { QueuedPanel, SubmittedPanel, type Receipt } from "@/components/organisms";
import {
  BUS_SERVICES,
  COMMENDATION_CATEGORIES,
  COMMENDATION_CATEGORIES_FOR,
  COMMENDEES,
  type BusService,
  type CommendationCategory,
  type Commendee,
  type Language,
} from "@/constants/reportConstants";
import { useSmsAvailable } from "@/hooks/useContactChannels";
import useFormDraft from "@/hooks/useFormDraft";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { busQuery, isNewQrScan, parseBusNumber, parseRoute } from "@/lib/busNumber";
import { submitOrQueue } from "@/lib/offlineSubmit";
import { COMMEND_DRAFT_KEY as DRAFT_KEY } from "@/lib/reportDraft";
import { rememberReceipt } from "@/lib/trackingHistory";

const MAX_DESCRIPTION = 2000;

interface CommendForm {
  commendee: Commendee | "";
  busService: BusService | "";
  busNumber: string;
  routeNumber: string;
  category: CommendationCategory | "";
  description: string;
  incidentAt: string;
  location: string;
  passengerEmail: string;
  passengerPhone: string;
  website: string;
}

const EMPTY_FORM: CommendForm = {
  commendee: "",
  busService: "",
  busNumber: "",
  routeNumber: "",
  category: "",
  description: "",
  incidentAt: "",
  location: "",
  passengerEmail: "",
  passengerPhone: "",
  website: "", // Honeypot
};

interface Draft {
  form: CommendForm;
  source: "web" | "qr";
}

const isEmptyDraft = ({ form }: Draft) =>
  !form.commendee &&
  !form.category &&
  !form.description.trim() &&
  !form.location.trim() &&
  !form.incidentAt;

const COMMENDEE_ICONS: Record<Commendee, ReactNode> = {
  driver: <AirlineSeatReclineNormalRoundedIcon />,
  conductor: <ConfirmationNumberRoundedIcon />,
  crew: <GroupsRoundedIcon />,
  service: <StorefrontRoundedIcon />,
};

/** The reasons that fit who is being thanked (all of them until that is chosen) */
const categoriesFor = (commendee: Commendee | "") =>
  commendee
    ? COMMENDATION_CATEGORIES.filter((c) =>
        COMMENDATION_CATEGORIES_FOR[commendee].includes(c.value),
      )
    : COMMENDATION_CATEGORIES;

type Result = { kind: "sent"; receipt: Receipt } | { kind: "queued" };

const nowForDateTimeInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const startIcon = (icon: ReactNode) => ({
  input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> },
});

/**
 * "Commend good service": thank the driver, the conductor, both, or the bus service as a whole.
 * One short step, no evidence, location optional.
 */
function CommendView() {
  const t = useTranslations("commend");
  // No phone field when no SMS gateway is set up: there would be nothing to send to it
  const smsAvailable = useSmsAvailable();
  const ts = useTranslations("submit");
  const tCategory = useTranslations("categories");
  const tService = useTranslations("busServices");
  const tCommendee = useTranslations("commendees");
  const tCommendeeHint = useTranslations("commendeeHints");
  const locale = useLocale() as Language;
  const online = useOnlineStatus();

  const searchParams = useSearchParams();
  const qrBus = parseBusNumber(searchParams.get("bus"));
  const qrRoute = parseRoute(searchParams.get("route"));
  const fromQr = searchParams.get("src") === "qr";
  const prefilled = { ...EMPTY_FORM, busNumber: qrBus, routeNumber: qrRoute };

  const [formData, setFormData] = useState<CommendForm>(prefilled);
  const [source, setSource] = useState<"web" | "qr">(fromQr ? "qr" : "web");
  const [commendeeError, setCommendeeError] = useState(false);
  const [busServiceError, setBusServiceError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const started = useRef(false);
  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("commendation_form_started");
  };

  // Once per bus per session, so switching between the report and commend forms counts once
  useEffect(() => {
    if (fromQr && qrBus && isNewQrScan(qrBus)) trackEvent("qr_scan");
  }, [fromQr, qrBus]);

  const draft = useMemo<Draft>(() => ({ form: formData, source }), [formData, source]);
  const { restoredAt, discard, dismissNotice } = useFormDraft<Draft>({
    key: DRAFT_KEY,
    value: draft,
    isEmpty: isEmptyDraft,
    onRestore: (saved) => {
      if (qrBus && saved.form.busNumber && saved.form.busNumber !== qrBus) return false;
      setFormData({ ...EMPTY_FORM, ...saved.form, busNumber: saved.form.busNumber || qrBus });
      setSource(fromQr ? "qr" : saved.source);
      started.current = true;
      return true;
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    markStarted();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const missing = {
      commendee: !formData.commendee,
      busService: !formData.busService,
      category: !formData.category,
    };
    setCommendeeError(missing.commendee);
    setBusServiceError(missing.busService);
    setCategoryError(missing.category);
    if (missing.commendee || missing.busService || missing.category) return;
    setSubmitting(true);
    setErrorText("");
    try {
      const outcome = await submitOrQueue(
        {
          busNumber: formData.busNumber,
          routeNumber: formData.routeNumber,
          busService: formData.busService,
          category: formData.category,
          description: formData.description,
          location: formData.location,
          passengerEmail: formData.passengerEmail,
          passengerPhone: formData.passengerPhone,
          website: formData.website,
          details: JSON.stringify({ commendee: formData.commendee }),
          type: "commendation",
          incidentAt: formData.incidentAt ? new Date(formData.incidentAt).toISOString() : "",
          language: locale,
          source,
        },
        [],
        [],
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

  const reset = () => {
    void discard();
    setFormData(prefilled);
    setResult(null);
    started.current = false;
  };

  if (result?.kind === "sent") {
    return <SubmittedPanel receipt={result.receipt} type="commendation" onReset={reset} />;
  }
  if (result?.kind === "queued") return <QueuedPanel type="commendation" onReset={reset} />;

  const reportHref = `/submit-report${busQuery(formData.busNumber || qrBus, formData.routeNumber, fromQr ? "qr" : undefined)}`;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            mb: 2,
            borderRadius: 4,
            display: "grid",
            placeItems: "center",
            color: "success.main",
            bgcolor: "rgba(var(--mui-palette-success-mainChannel) / 0.14)",
          }}
        >
          <ThumbUpAltRoundedIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="overline" sx={{ color: "success.main" }} component="p">
          {t("eyebrow")}
        </Typography>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.4rem" } }}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 560, mx: "auto" }}>
          {t("subtitle")}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 1.5, mb: 2, "&:empty": { display: "none" } }}>
        {!online && (
          <Alert severity="warning" icon={<CloudOffRoundedIcon />}>
            {ts("offlineBanner")}
          </Alert>
        )}
        {restoredAt && (
          <Alert
            severity="info"
            icon={<HistoryRoundedIcon />}
            onClose={dismissNotice}
            action={
              <Button color="inherit" size="small" onClick={reset}>
                {ts("discardDraft")}
              </Button>
            }
          >
            {ts("draftRestored")}
          </Alert>
        )}
        {fromQr && qrBus && !restoredAt && (
          <Alert severity="success" icon={<QrCode2RoundedIcon />}>
            {ts("qrBanner", { bus: qrBus })}
          </Alert>
        )}
      </Box>

      <Card
        component="form"
        onSubmit={(e: FormEvent<HTMLFormElement>) => void handleSubmit(e)}
        sx={{ p: { xs: 2.5, sm: 4 }, display: "grid", gap: 2.5 }}
      >
        <ChoiceCards
          label={t("whoQuestion")}
          options={COMMENDEES.map(({ value }) => ({
            value,
            label: tCommendee(value),
            description: tCommendeeHint(value),
            icon: COMMENDEE_ICONS[value],
          }))}
          value={formData.commendee}
          onChange={(commendee) => {
            markStarted();
            // Drop a reason that doesn't fit, e.g. "safe driving" for a conductor
            const keep = COMMENDATION_CATEGORIES_FOR[commendee].includes(formData.category);
            setFormData({ ...formData, commendee, category: keep ? formData.category : "" });
            setCommendeeError(false);
          }}
          error={commendeeError ? t("chooseWho") : undefined}
        />

        <CategoryPicker
          color="success"
          label={ts("busServiceQuestion")}
          options={BUS_SERVICES.map((b) => ({ value: b.value, label: tService(b.value) }))}
          value={formData.busService}
          onChange={(busService) => {
            markStarted();
            setFormData({ ...formData, busService });
            setBusServiceError(false);
          }}
          error={busServiceError ? ts("chooseBusService") : undefined}
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={ts("busNumber")}
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
              label={ts("route")}
              placeholder={ts("routePlaceholder")}
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

        <CategoryPicker
          color="success"
          label={t("whatWasGood")}
          options={categoriesFor(formData.commendee).map((c) => ({
            value: c.value,
            label: tCategory(c.value),
          }))}
          value={formData.category}
          onChange={(category) => {
            markStarted();
            setFormData({ ...formData, category });
            setCategoryError(false);
          }}
          error={categoryError ? t("chooseCategory") : undefined}
        />

        <TextField
          fullWidth
          required
          multiline
          minRows={4}
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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="datetime-local"
              label={t("when")}
              name="incidentAt"
              value={formData.incidentAt}
              onChange={handleChange}
              slotProps={{
                htmlInput: { max: nowForDateTimeInput() },
                inputLabel: { shrink: true },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t("where")}
              placeholder={t("wherePlaceholder")}
              name="location"
              value={formData.location}
              onChange={handleChange}
              slotProps={startIcon(<LocationOnRoundedIcon color="action" />)}
            />
          </Grid>
        </Grid>

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
            invalidText={ts("phoneInvalid")}
            value={formData.passengerPhone}
            onChange={handleChange}
          />
        )}
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

        <Typography variant="body2" color="text.secondary">
          {t.rich("consent", {
            terms: (chunks) => <Link href="/terms-of-service">{chunks}</Link>,
            privacy: (chunks) => <Link href="/privacy-policy">{chunks}</Link>,
          })}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t.rich("reportInstead", {
              link: (chunks) => <Link href={reportHref}>{chunks}</Link>,
            })}
          </Typography>
          <Button
            type="submit"
            size="large"
            variant="contained"
            color="success"
            loading={submitting}
            endIcon={<FavoriteRoundedIcon />}
          >
            {t("send")}
          </Button>
        </Box>
      </Card>

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

export default CommendView;
