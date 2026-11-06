"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ApiError, toApiError } from "@/api/apiClient";
import { requestSignInCode, verifySignInCode } from "@/api/passengerApi";
import { GradientButton, StatusChip } from "@/components/atoms";
import { EmptyState, ReceiptSearchForm } from "@/components/molecules";
import { HeroBand } from "@/components/templates";
import type { Language } from "@/constants/reportConstants";
import { useSmsAvailable } from "@/hooks/useContactChannels";
import useIsClient from "@/hooks/useIsClient";
import { useMyReports } from "@/hooks/useReportQueries";
import { passengerSession } from "@/lib/passengerSession";
import { normalisePhone } from "@/lib/phone";
import { recentReceipts } from "@/lib/trackingHistory";
import type { PassengerReportSummary } from "@/types/report";

const looksLikeContact = (value: string) =>
  value.includes("@") ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) : !!normalisePhone(value);

/** Step 1: email or phone. Step 2: the one-time code. */
function SignInCard() {
  const t = useTranslations("myReports");
  const locale = useLocale() as Language;
  // Email only when no SMS gateway is set up (codes by SMS couldn't be delivered)
  const smsAvailable = useSmsAvailable();
  const [contact, setContact] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = (caught: unknown) => {
    const apiError = toApiError(caught);
    if (apiError.code === "invalid_code") return t("invalidCode");
    if (apiError.code === "channel_unavailable") {
      return contact.includes("@") ? t("emailUnavailable") : t("smsUnavailable");
    }
    return apiError.message || t("error");
  };

  const sendCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);
    if (!looksLikeContact(contact)) {
      setError(t("contactInvalid"));
      return;
    }
    setBusy(true);
    try {
      const result = await requestSignInCode(contact, locale);
      setSentTo(result.sentTo);
      setCode("");
    } catch (caught) {
      setError(explain(caught));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      passengerSession.set(await verifySignInCode(contact, code));
    } catch (caught) {
      setError(explain(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ p: { xs: 2.5, sm: 4 } }}>
      {sentTo === null ? (
        <Box component="form" onSubmit={(e) => void sendCode(e)} sx={{ display: "grid", gap: 2 }}>
          <TextField
            fullWidth
            autoFocus
            label={smsAvailable ? t("contactLabel") : t("contactLabelEmail")}
            placeholder={smsAvailable ? t("contactPlaceholder") : t("contactPlaceholderEmail")}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            autoComplete="email"
            slotProps={{ htmlInput: { maxLength: 254 } }}
          />
          <GradientButton type="submit" loading={busy} disabled={!contact.trim()}>
            {t("sendCode")}
          </GradientButton>
        </Box>
      ) : (
        <Box component="form" onSubmit={(e) => void verify(e)} sx={{ display: "grid", gap: 2 }}>
          <Alert severity="info" icon={<MarkEmailReadRoundedIcon />}>
            {t("codeSent", { sentTo })}
          </Alert>
          <TextField
            fullWidth
            autoFocus
            label={t("codeLabel")}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoComplete="one-time-code"
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "\\d{6}",
                maxLength: 6,
                style: { letterSpacing: "0.5em", fontWeight: 700, fontSize: "1.3rem" },
              },
            }}
          />
          <GradientButton
            type="submit"
            loading={busy}
            disabled={code.length !== 6}
            startIcon={<LockOpenRoundedIcon />}
          >
            {t("verify")}
          </GradientButton>
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Button size="small" onClick={() => setSentTo(null)}>
              {t("changeContact")}
            </Button>
            <Button size="small" onClick={() => void sendCode()} disabled={busy}>
              {t("resend")}
            </Button>
          </Box>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Card>
  );
}

function ReportRow({ report }: { report: PassengerReportSummary }) {
  const t = useTranslations("myReports");
  const tStatus = useTranslations("statuses");
  const tCategory = useTranslations("categories");
  const tMessages = useTranslations("messages");
  const format = useFormatter();
  const href = `/track/${encodeURIComponent(report.receiptId)}${report.unreadMessages ? "#messages" : ""}`;

  return (
    <Card
      component="a"
      href={href}
      sx={{
        p: { xs: 2, sm: 2.5 },
        display: "flex",
        alignItems: "center",
        gap: 2,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.2s, transform 0.2s",
        "&:hover": { borderColor: "primary.main", transform: "translateY(-1px)" },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography sx={{ fontFamily: "ui-monospace, monospace", fontWeight: 800 }}>
            {report.receiptId}
          </Typography>
          <StatusChip status={report.status} label={tStatus(report.status)} size="small" />
          {report.type === "commendation" && (
            <Chip
              icon={<ThumbUpAltRoundedIcon />}
              label={t("commendation")}
              color="success"
              variant="outlined"
              size="small"
            />
          )}
          {report.unreadMessages > 0 && (
            <Chip
              icon={<ForumRoundedIcon />}
              label={tMessages("newCount", { count: report.unreadMessages })}
              color="primary"
              size="small"
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ mt: 0.75 }}>
          {tCategory(report.category)} · {report.busNumber} · {report.routeNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("lastUpdate", {
            time: format.relativeTime(new Date(report.lastUpdateAt), new Date()),
          })}
        </Typography>
      </Box>
      <ChevronRightRoundedIcon color="action" />
    </Card>
  );
}

function SignedIn({ token, display }: { token: string; display: string }) {
  const t = useTranslations("myReports");
  const query = useMyReports(token);
  const expired = query.error instanceof ApiError && query.error.status === 401;

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h2" sx={{ flex: 1 }}>
          {t("listTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("signedInAs", { contact: query.data?.contact.display ?? display })}
        </Typography>
        <Button
          size="small"
          startIcon={<LogoutRoundedIcon />}
          onClick={() => passengerSession.set(null)}
        >
          {t("signOut")}
        </Button>
      </Box>

      {query.isPending && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}
      {expired ? (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => passengerSession.set(null)}>
              {t("verify")}
            </Button>
          }
        >
          {t("expired")}
        </Alert>
      ) : (
        query.error && <Alert severity="error">{t("error")}</Alert>
      )}
      {query.data?.reports.length === 0 && (
        <Card>
          <EmptyState
            icon={<SearchOffRoundedIcon />}
            title={t("empty")}
            description={t("emptyHint")}
          />
        </Card>
      )}
      {query.data?.reports.map((report) => (
        <ReportRow key={report.receiptId} report={report} />
      ))}
    </Stack>
  );
}

/** Receipts submitted or looked up on this device: works without signing in. */
function DeviceReceipts() {
  const t = useTranslations("myReports");
  const isClient = useIsClient();
  const receipts = isClient ? recentReceipts() : [];

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Typography variant="subtitle1" component="h2">
        {t("deviceTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("deviceText")}
      </Typography>
      {receipts.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 2.5 }}>
          {receipts.slice(0, 10).map((id) => (
            <Chip
              key={id}
              icon={<ReceiptLongRoundedIcon />}
              label={id}
              component="a"
              href={`/track/${encodeURIComponent(id)}`}
              clickable
              variant="outlined"
              sx={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}
            />
          ))}
        </Stack>
      )}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {t("trackById")}
      </Typography>
      <ReceiptSearchForm />
    </Card>
  );
}

/**
 * "My reports" without passwords: a one-time code by email or SMS opens a list of every report the
 * passenger sent with that contact, with new team messages flagged.
 */
function MyReportsView() {
  const t = useTranslations("myReports");
  const session = useSyncExternalStore(
    passengerSession.subscribe,
    passengerSession.get,
    passengerSession.getServer,
  );

  return (
    <>
      <HeroBand eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            {session ? (
              <SignedIn token={session.token} display={session.contact.display} />
            ) : (
              <SignInCard />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <DeviceReceipts />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default MyReportsView;
