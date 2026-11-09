"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BlurOnRoundedIcon from "@mui/icons-material/BlurOnRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import { errorMessage } from "@/api/apiClient";
import { SectionPanel } from "@/components/molecules";
import { categoryLabel } from "@/constants/reportConstants";
import {
  useAiStatus,
  useAnalyseReport,
  useBlurReportPhotos,
  useSetReportCategory,
} from "@/hooks/useReportQueries";
import { formatDateTime } from "@/lib/format";
import type { AiInsights, Report } from "@/types/report";

const FLAG_LABELS: Record<AiInsights["flags"][number], string> = {
  personal_details: "Contains personal details",
  abusive_language: "Abusive language",
  possible_emergency: "Possible emergency",
  not_a_bus_issue: "May not be about a bus",
};

const LANGUAGE_NAMES: Record<AiInsights["detectedLanguage"], string> = {
  en: "English",
  si: "Sinhala",
  ta: "Tamil",
  other: "another language",
};

const quote = {
  p: 1.5,
  borderRadius: 2,
  bgcolor: "action.hover",
  whiteSpace: "pre-line",
} as const;

/**
 * AI help for admins: category suggestion, translation and summary, and blurring faces and
 * number plates in photos. Hidden when ANTHROPIC_API_KEY isn't set on the API.
 */
function AiAssistantPanel({ report }: { report: Report }) {
  const status = useAiStatus();
  const analyse = useAnalyseReport(report.id);
  const blur = useBlurReportPhotos(report.id);
  const setCategory = useSetReportCategory(report.id);

  if (!status.data?.enabled) return null;
  const insights = report.aiInsights;
  const error = analyse.error ?? blur.error ?? setCategory.error;

  return (
    <SectionPanel
      title="AI assistant"
      subtitle="Suggestions only: check them before acting. Nothing here is shown to the passenger."
      icon={<AutoAwesomeRoundedIcon fontSize="small" />}
      action={
        <Button
          size="small"
          variant={insights ? "text" : "contained"}
          startIcon={<AutoAwesomeRoundedIcon />}
          loading={analyse.isPending}
          onClick={() => analyse.mutate()}
        >
          {insights ? "Analyse again" : "Analyse"}
        </Button>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(error, "The AI request failed.")}
        </Alert>
      )}

      {!insights && !analyse.isPending && (
        <Typography variant="body2" color="text.secondary">
          Get a category suggestion, an English translation of Sinhala or Tamil text, and a summary
          of long reports.
        </Typography>
      )}
      {analyse.isPending && (
        <Typography variant="body2" color="text.secondary">
          Reading the report…
        </Typography>
      )}

      {insights && (
        <Box sx={{ display: "grid", gap: 2 }}>
          {insights.flags.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {insights.flags.map((flag) => (
                <Chip
                  key={flag}
                  size="small"
                  label={FLAG_LABELS[flag]}
                  color={flag === "possible_emergency" ? "error" : "warning"}
                />
              ))}
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2">Suggested category</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
              <Typography sx={{ fontWeight: 700 }}>
                {categoryLabel(insights.suggestedCategory)}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={`${insights.categoryConfidence} confidence`}
              />
              {insights.suggestedCategory === report.category ? (
                <Chip size="small" color="success" icon={<CheckRoundedIcon />} label="Matches" />
              ) : (
                <Button
                  size="small"
                  loading={setCategory.isPending}
                  onClick={() => setCategory.mutate(insights.suggestedCategory)}
                >
                  Use this category
                </Button>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {insights.categoryReason}
            </Typography>
          </Box>

          {insights.englishTranslation && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}
              >
                <TranslateRoundedIcon fontSize="small" /> English translation (from{" "}
                {LANGUAGE_NAMES[insights.detectedLanguage]})
              </Typography>
              <Typography sx={quote}>{insights.englishTranslation}</Typography>
            </Box>
          )}

          {insights.summary && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Summary
              </Typography>
              <Typography sx={quote}>{insights.summary}</Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            {insights.model} · {formatDateTime(insights.generatedAt)}
          </Typography>
        </Box>
      )}

      {report.images.length > 0 && (
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography variant="subtitle2">Privacy blur for photos</Typography>
              <Typography variant="body2" color="text.secondary">
                {report.blurredImages
                  ? `${report.blurredImages.length} blurred cop${report.blurredImages.length === 1 ? "y" : "ies"}. Bus operators only ever see these.`
                  : "Blur faces and number plates before bus operators see the photos."}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<BlurOnRoundedIcon />}
              loading={blur.isPending}
              onClick={() => blur.mutate()}
            >
              {report.blurredImages ? "Blur again" : "Blur faces and plates"}
            </Button>
          </Box>
          {blur.data && (
            <Alert severity="success" sx={{ mt: 1.5 }}>
              Blurred {blur.data.blurredRegions} area{blur.data.blurredRegions === 1 ? "" : "s"}{" "}
              found by the AI, plus faces found by Cloudinary.
            </Alert>
          )}
          {report.blurredImages && report.blurredImages.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
              {report.blurredImages.map((url, index) => (
                <Box
                  key={url}
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "block",
                    width: 96,
                    height: 72,
                    borderRadius: 1.5,
                    overflow: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary preview */}
                  <img
                    src={url}
                    alt={`Blurred photo ${index + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </SectionPanel>
  );
}

export default AiAssistantPanel;
