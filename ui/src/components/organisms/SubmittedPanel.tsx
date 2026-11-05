"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { trackEvent } from "@/api/metricsApi";
import { GradientButton } from "@/components/atoms";
import { ResultCard, ShareButton } from "@/components/molecules";
import type { ReportType } from "@/constants/reportConstants";

export interface Receipt {
  receiptId: string;
  pdfUrl: string | null;
  emailSent: boolean;
}

/** Shown after a report or commendation was sent: receipt ID, tracking, PDF and sharing. */
function SubmittedPanel({
  receipt,
  type,
  onReset,
}: {
  receipt: Receipt;
  type: ReportType;
  onReset: () => void;
}) {
  const t = useTranslations("success");
  const tc = useTranslations("common");
  const ts = useTranslations("share");
  const ts2 = useTranslations("statuses");
  const [copied, setCopied] = useState(false);
  const commendation = type === "commendation";
  const trackPath = `/track/${encodeURIComponent(receipt.receiptId)}`;

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
    <ResultCard
      icon={commendation ? <ThumbUpAltRoundedIcon /> : <TaskAltRoundedIcon />}
      color="success"
    >
      <Typography variant="h4" component="h1" sx={{ mt: 3 }}>
        {commendation ? t("commendTitle") : t("title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {commendation && `${t("commendText")} `}
        {t("saveId")}
        {receipt.emailSent && ` ${t("emailed")}`}
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
        <Tooltip title={copied ? tc("copied") : t("copyId")}>
          <IconButton aria-label={t("copyId")} onClick={() => void copy()}>
            {copied ? <CheckRoundedIcon color="success" /> : <ContentCopyRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mt: 4, justifyContent: "center", flexWrap: "wrap" }}>
        <GradientButton href={trackPath} size="large">
          {t("track")}
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
            {t("receiptPdf")}
          </Button>
        )}
        <ShareButton
          size="large"
          path={trackPath}
          title={ts("title", { receiptId: receipt.receiptId })}
          text={ts("text", { status: ts2("pending") })}
          onShared={() => trackEvent("report_shared")}
        />
      </Box>
      <Button onClick={onReset} sx={{ mt: 2 }}>
        {commendation ? t("anotherCommendation") : t("another")}
      </Button>
    </ResultCard>
  );
}

export default SubmittedPanel;
