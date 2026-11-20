"use client";

import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toApiError } from "@/api/apiClient";
import { confirmReport } from "@/api/reportApi";
import { GradientButton } from "@/components/atoms";
import type { Language } from "@/constants/reportConstants";
import type { SimilarReport } from "@/types/report";

const MAX_COMMENT = 1000; // Must match CONFIRMATION.maxCommentLength in the API

interface MeTooDialogProps {
  matches: SimilarReport[];
  busNumber: string;
  categoryLabel: string;
  /** What the passenger has typed so far; offered as their comment */
  description: string;
  language: Language;
  source: "web" | "qr";
  /** Honeypot value from the form */
  website?: string;
  onConfirmed: () => void;
  /** "No, mine is different": carry on with a full report */
  onDecline: () => void;
}

/**
 * "Did you see this too?": other passengers already reported this bus for the same thing on the
 * same day. Confirming backs up their report instead of filing a duplicate.
 */
function MeTooDialog({
  matches,
  busNumber,
  categoryLabel,
  description,
  language,
  source,
  website,
  onConfirmed,
  onDecline,
}: MeTooDialogProps) {
  const t = useTranslations("meToo");
  const [selected, setSelected] = useState(matches[0]?.id ?? "");
  const [comment, setComment] = useState(description.slice(0, MAX_COMMENT));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const describe = (match: SimilarReport) =>
    [
      t("route", { route: match.routeNumber }),
      match.partOfDay ? t(`partOfDay.${match.partOfDay}`) : null,
      match.confirmations ? t("alreadyConfirmed", { count: match.confirmations }) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const send = async () => {
    setSending(true);
    setError("");
    try {
      await confirmReport(selected, { comment, language, source, website });
      onConfirmed();
    } catch (caught) {
      const apiError = toApiError(caught);
      // Confirmed from this device before: that's what they wanted anyway
      if (apiError.code === "already_confirmed") onConfirmed();
      else setError(apiError.message || t("failed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={sending ? undefined : onDecline}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <GroupsRoundedIcon color="primary" />
        {t("title")}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <Typography color="text.secondary">
          {t("intro", { count: matches.length, bus: busNumber, category: categoryLabel })}
        </Typography>

        {matches.length > 1 ? (
          <RadioGroup
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label={t("chooseReport")}
          >
            {matches.map((match, index) => (
              <FormControlLabel
                key={match.id}
                value={match.id}
                control={<Radio />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {t("reportNumber", { number: index + 1 })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {describe(match)}
                    </Typography>
                  </Box>
                }
                sx={{ py: 0.5 }}
              />
            ))}
          </RadioGroup>
        ) : (
          matches[0] && (
            <Box sx={{ borderRadius: 3, border: 1, borderColor: "divider", px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 600 }}>
                {busNumber} · {categoryLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {describe(matches[0])}
              </Typography>
            </Box>
          )
        )}

        <TextField
          fullWidth
          multiline
          minRows={3}
          label={t("comment")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          helperText={t("commentHelp")}
          slotProps={{ htmlInput: { maxLength: MAX_COMMENT } }}
        />
        <Alert severity="info">{t("anonymous")}</Alert>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onDecline} disabled={sending}>
          {t("decline")}
        </Button>
        <GradientButton onClick={() => void send()} loading={sending} disabled={!selected}>
          {t("confirm")}
        </GradientButton>
      </DialogActions>
    </Dialog>
  );
}

export default MeTooDialog;
