"use client";

import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
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
import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toApiError } from "@/api/apiClient";
import { GradientButton } from "@/components/atoms";
import { CategoryPicker, PageIntro, PhoneField } from "@/components/molecules";
import { QueuedPanel, SubmittedPanel, type Receipt } from "@/components/organisms";
import {
  LOST_ITEM_CATEGORIES,
  type Language,
  type LostItemCategory,
} from "@/constants/reportConstants";
import { useSmsAvailable } from "@/hooks/useContactChannels";
import useFormDraft from "@/hooks/useFormDraft";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { parseBusNumber, parseRoute } from "@/lib/busNumber";
import { submitOrQueue } from "@/lib/offlineSubmit";
import { LOST_DRAFT_KEY as DRAFT_KEY } from "@/lib/reportDraft";
import { rememberReceipt } from "@/lib/trackingHistory";

const MAX_DESCRIPTION = 2000;

interface LostForm {
  busNumber: string;
  routeNumber: string;
  category: LostItemCategory | "";
  description: string;
  incidentAt: string;
  location: string;
  passengerEmail: string;
  passengerPhone: string;
  website: string;
}

const EMPTY_FORM: LostForm = {
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

const isEmptyDraft = (form: LostForm) =>
  !form.category && !form.description.trim() && !form.location.trim() && !form.incidentAt;

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
 * "Lost something?": one short form. It goes to the TransitX team and, straight away, to the bus
 * operator if they use TransitX. A way to reach the passenger is required.
 */
function LostItemView() {
  const t = useTranslations("lost");
  const ts = useTranslations("submit");
  const tCategory = useTranslations("categories");
  const smsAvailable = useSmsAvailable();
  const locale = useLocale() as Language;
  const online = useOnlineStatus();

  const searchParams = useSearchParams();
  const prefilled = {
    ...EMPTY_FORM,
    busNumber: parseBusNumber(searchParams.get("bus")),
    routeNumber: parseRoute(searchParams.get("route")),
  };

  const [formData, setFormData] = useState<LostForm>(prefilled);
  const [categoryError, setCategoryError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const draft = useMemo(() => formData, [formData]);
  const { restoredAt, discard, dismissNotice } = useFormDraft<LostForm>({
    key: DRAFT_KEY,
    value: draft,
    isEmpty: isEmptyDraft,
    onRestore: (saved) => {
      setFormData({ ...EMPTY_FORM, ...saved });
      return true;
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.target.name === "passengerEmail" || e.target.name === "passengerPhone") {
      setContactError(false);
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category) {
      setCategoryError(true);
      return;
    }
    if (!formData.passengerEmail.trim() && !formData.passengerPhone.trim()) {
      setContactError(true);
      return;
    }
    setSubmitting(true);
    setErrorText("");
    try {
      const outcome = await submitOrQueue(
        {
          ...formData,
          type: "lost_item",
          incidentAt: formData.incidentAt ? new Date(formData.incidentAt).toISOString() : "",
          language: locale,
          source: "web",
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
  };

  if (result?.kind === "sent") {
    return <SubmittedPanel receipt={result.receipt} type="lost_item" onReset={reset} />;
  }
  if (result?.kind === "queued") return <QueuedPanel type="lost_item" onReset={reset} />;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
      <PageIntro
        icon={<TravelExploreRoundedIcon />}
        color="info"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

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
      </Box>

      <Card
        component="form"
        onSubmit={(e: FormEvent<HTMLFormElement>) => void handleSubmit(e)}
        sx={{ p: { xs: 2.5, sm: 4 }, display: "grid", gap: 2.5 }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              autoFocus
              label={ts("busNumber")}
              placeholder="NE-9999"
              helperText={t("busHelp")}
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
          label={t("whatLost")}
          options={LOST_ITEM_CATEGORIES.map((c) => ({ value: c.value, label: tCategory(c.value) }))}
          value={formData.category}
          onChange={(category) => {
            setFormData({ ...formData, category });
            setCategoryError(false);
          }}
          error={categoryError ? t("chooseCategory") : undefined}
        />

        <TextField
          fullWidth
          required
          multiline
          minRows={3}
          label={t("description")}
          placeholder={t("descriptionPlaceholder")}
          name="description"
          value={formData.description}
          onChange={handleChange}
          helperText={`${t("descriptionHelp")} ${formData.description.length} / ${MAX_DESCRIPTION}`}
          slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION } }}
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

        <Box sx={{ display: "grid", gap: 2 }}>
          <Typography variant="subtitle2">{t("contactTitle")}</Typography>
          <TextField
            fullWidth
            type="email"
            label={ts("email")}
            name="passengerEmail"
            value={formData.passengerEmail}
            onChange={handleChange}
            required={!smsAvailable}
            slotProps={startIcon(<EmailRoundedIcon color="action" />)}
          />
          {smsAvailable && (
            <PhoneField
              name="passengerPhone"
              label={ts("phone")}
              helperText={t("phoneHelp")}
              invalidText={ts("phoneInvalid")}
              value={formData.passengerPhone}
              onChange={handleChange}
            />
          )}
          {contactError && (
            <Typography variant="body2" color="error" role="alert">
              {t("contactRequired")}
            </Typography>
          )}
        </Box>

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

        <Alert severity="info">{t("howItWorks")}</Alert>

        <Typography variant="body2" color="text.secondary">
          {ts.rich("consent", {
            terms: (chunks) => <Link href="/terms-of-service">{chunks}</Link>,
            privacy: (chunks) => <Link href="/privacy-policy">{chunks}</Link>,
          })}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <GradientButton
            type="submit"
            size="large"
            loading={submitting}
            endIcon={<SendRoundedIcon />}
          >
            {t("send")}
          </GradientButton>
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

export default LostItemView;
