"use client";

import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Alert, Box, Button, Card, Rating, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/api/apiClient";
import { useRateOutcome } from "@/hooks/useReportQueries";
import type { PublicReport } from "@/types/report";

/**
 * "Rate the outcome": once a complaint is closed the passenger can say how satisfied they were
 * (1–5 stars and an optional comment). Reached from the resolution email via /track/<id>#rate.
 */
function OutcomeRating({ report }: { report: PublicReport }) {
  const t = useTranslations("rating");
  const mutation = useRateOutcome(report.receiptId);
  const [editing, setEditing] = useState(report.rating === null);
  const [rating, setRating] = useState<number | null>(report.rating);
  const [hover, setHover] = useState(-1);
  const [feedback, setFeedback] = useState(report.feedback ?? "");

  const shown = hover !== -1 ? hover : rating;
  const label = shown ? t(String(shown) as "1" | "2" | "3" | "4" | "5") : "";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rating) return;
    mutation.mutate({ rating, feedback }, { onSuccess: () => setEditing(false) });
  };

  return (
    <Card
      id="rate"
      sx={{
        p: { xs: 2.5, sm: 3 },
        scrollMarginTop: 96,
        borderColor: "rgba(var(--mui-palette-warning-mainChannel) / 0.4)",
        background:
          "linear-gradient(135deg, rgba(var(--mui-palette-warning-mainChannel) / 0.08) 0%, transparent 70%)",
      }}
    >
      {!editing && report.rating !== null ? (
        <Box>
          <Typography variant="subtitle1" component="h2">
            {t("thanks")}
          </Typography>
          <Rating value={report.rating} readOnly sx={{ mt: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("youRated", { rating: report.rating })}
          </Typography>
          {report.feedback && (
            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "action.hover",
                whiteSpace: "pre-line",
              }}
            >
              {report.feedback}
            </Typography>
          )}
          <Button size="small" onClick={() => setEditing(true)} sx={{ mt: 1.5, ml: -1 }}>
            {t("change")}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={submit}>
          <Typography variant="subtitle1" component="h2">
            {t("title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("subtitle")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
            <Rating
              name="outcome-rating"
              value={rating}
              size="large"
              onChange={(_, value) => setRating(value)}
              onChangeActive={(_, value) => setHover(value)}
              emptyIcon={<StarRoundedIcon fontSize="inherit" sx={{ opacity: 0.35 }} />}
              icon={<StarRoundedIcon fontSize="inherit" />}
              getLabelText={(value) => `${value}/5 · ${t(String(value) as "1")}`}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, minHeight: 20 }} aria-live="polite">
              {label}
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t("feedback")}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            sx={{ mt: 2 }}
          />
          {mutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage(mutation.error, t("failed"))}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={!rating}
            loading={mutation.isPending}
            sx={{ mt: 2 }}
          >
            {t("send")}
          </Button>
        </Box>
      )}
    </Card>
  );
}

export default OutcomeRating;
