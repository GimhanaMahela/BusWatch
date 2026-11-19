"use client";

import CallRoundedIcon from "@mui/icons-material/CallRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Alert, Box, Button, Card, Container, Grid, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { toApiError } from "@/api/apiClient";
import { ChoiceChips, EmergencyBanner, PhoneField } from "@/components/molecules";
import { TripSharePanel } from "@/components/organisms";
import { WOMENS_HELPLINE } from "@/constants/emergency";
import { SAFETY_KINDS, type Language, type SafetyKind } from "@/constants/reportConstants";
import { useSmsAvailable } from "@/hooks/useContactChannels";
import useEmergencyCheck from "@/hooks/useEmergencyCheck";
import { parseBusNumber, parseRoute } from "@/lib/busNumber";
import { submitOrQueue } from "@/lib/offlineSubmit";
import { rememberReceipt } from "@/lib/trackingHistory";

/** Leaves for a neutral page and replaces this one in the history, so "back" doesn't return. */
const quickExit = () => window.location.replace("https://www.google.com/");

interface QuickForm {
  busNumber: string;
  routeNumber: string;
  description: string;
  location: string;
  passengerEmail: string;
  passengerPhone: string;
  website: string;
}

type Sent = { kind: "sent"; receiptId: string } | { kind: "queued" };

/**
 * Safety mode: a quick, quiet harassment report (few fields, nothing required but the bus), the
 * emergency numbers always in view, a quick-exit button, and "Share my trip".
 */
function SafetyView() {
  const t = useTranslations("safety");
  const ts = useTranslations("submit");
  const tKind = useTranslations("safetyKinds");
  const locale = useLocale() as Language;
  const smsAvailable = useSmsAvailable();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<QuickForm>({
    busNumber: parseBusNumber(searchParams.get("bus")),
    routeNumber: parseRoute(searchParams.get("route")),
    description: "",
    location: "",
    passengerEmail: "",
    passengerPhone: "",
    website: "",
  });
  const [kinds, setKinds] = useState<SafetyKind[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const emergency = useEmergencyCheck(form.description, locale);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const outcome = await submitOrQueue(
        {
          ...form,
          type: "complaint",
          category: "harassment",
          details: JSON.stringify({ safety: { kinds } }),
          language: locale,
          source: "web",
        },
        [],
        [],
      );
      if (outcome.kind === "sent") {
        rememberReceipt(outcome.response.receiptId);
        setSent({ kind: "sent", receiptId: outcome.response.receiptId });
      } else {
        setSent({ kind: "queued" });
      }
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(apiError.errors?.join(" ") || apiError.message || t("failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Box
        sx={{
          position: "sticky",
          top: { xs: 64, md: 80 },
          zIndex: 2,
          display: "flex",
          justifyContent: "flex-end",
          mb: 1,
        }}
      >
        <Button
          variant="contained"
          color="inherit"
          startIcon={<ExitToAppRoundedIcon />}
          onClick={quickExit}
          sx={{ bgcolor: "background.paper", boxShadow: 2 }}
        >
          {t("quickExit")}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
        <ShieldRoundedIcon color="secondary" />
        <Typography variant="overline" color="secondary">
          {t("eyebrow")}
        </Typography>
      </Box>
      <Typography variant="h4" component="h1">
        {t("title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        {t("subtitle")}
      </Typography>

      <Box sx={{ display: "grid", gap: 2 }}>
        {emergency.kind ? (
          <EmergencyBanner kind={emergency.kind} onDismiss={emergency.dismiss} />
        ) : (
          <EmergencyBanner kind={null} variant="calm" />
        )}
        <Button
          href={`tel:${WOMENS_HELPLINE}`}
          variant="outlined"
          color="secondary"
          startIcon={<CallRoundedIcon />}
          sx={{ justifySelf: "start" }}
        >
          {t("helpline", { number: WOMENS_HELPLINE })}
        </Button>

        <Card sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="h6" component="h2">
            {t("reportTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {t("reportText")}
          </Typography>

          {sent ? (
            <Alert severity="success">
              {sent.kind === "sent" ? (
                <>
                  {t("sent", { receiptId: sent.receiptId })}{" "}
                  <Link href={`/track/${encodeURIComponent(sent.receiptId)}`}>{t("track")}</Link>
                </>
              ) : (
                t("queued")
              )}
            </Alert>
          ) : (
            <Box
              component="form"
              onSubmit={(e: FormEvent<HTMLFormElement>) => void submit(e)}
              sx={{ display: "grid", gap: 2.5 }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label={ts("busNumber")}
                    placeholder="NE-9999"
                    name="busNumber"
                    value={form.busNumber}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { maxLength: 20 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label={ts("route")}
                    placeholder={ts("routePlaceholder")}
                    name="routeNumber"
                    value={form.routeNumber}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { maxLength: 60 } }}
                  />
                </Grid>
              </Grid>
              <ChoiceChips
                label={t("whatHappened")}
                options={SAFETY_KINDS.map((k) => ({ value: k.value, label: tKind(k.value) }))}
                value={kinds}
                onChange={setKinds}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label={t("details")}
                placeholder={t("detailsPlaceholder")}
                name="description"
                value={form.description}
                onChange={handleChange}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
              <TextField
                fullWidth
                label={t("where")}
                placeholder={ts("wherePlaceholder")}
                name="location"
                value={form.location}
                onChange={handleChange}
              />
              <Typography variant="subtitle2">{t("contactTitle")}</Typography>
              <TextField
                fullWidth
                type="email"
                label={ts("email")}
                name="passengerEmail"
                value={form.passengerEmail}
                onChange={handleChange}
              />
              {smsAvailable && (
                <PhoneField
                  name="passengerPhone"
                  label={ts("phone")}
                  helperText={t("contactHelp")}
                  invalidText={ts("phoneInvalid")}
                  value={form.passengerPhone}
                  onChange={handleChange}
                />
              )}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                loading={submitting}
              >
                {t("send")}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {t("privacy")}
              </Typography>
            </Box>
          )}
        </Card>

        <Card sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            {t("tripTitle")}
          </Typography>
          <TripSharePanel busNumber={form.busNumber} routeNumber={form.routeNumber} />
        </Card>
      </Box>
    </Container>
  );
}

export default SafetyView;
