"use client";

import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import TelegramIcon from "@mui/icons-material/Telegram";
import { Box, Button, Card, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getTelegramLink } from "@/api/pushApi";
import useContactChannels from "@/hooks/useContactChannels";

/**
 * "Get updates on Telegram": free updates through the BusWatch bot. The button opens Telegram,
 * the passenger presses Start, and that chat follows the report. Hidden when no bot is set up.
 */
function TelegramFollow({ receiptId, compact = false }: { receiptId: string; compact?: boolean }) {
  const t = useTranslations("telegram");
  const channels = useContactChannels();
  // Fetched ahead of the tap: browsers block windows opened after waiting for a request
  const link = useQuery({
    queryKey: ["telegramLink", receiptId],
    queryFn: () => getTelegramLink(receiptId),
    enabled: Boolean(channels?.telegram),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  if (!channels?.telegram || !link.data) return null;

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
      >
        <TelegramIcon fontSize="small" sx={{ color: "#229ED9" }} />
        {t("title")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("text")}
      </Typography>
      <Button
        variant="outlined"
        href={link.data.url}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<TelegramIcon />}
        endIcon={<OpenInNewRoundedIcon fontSize="small" />}
        sx={{ mt: 1.5, alignSelf: "flex-start" }}
      >
        {t("button")}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        {t("hint")}
      </Typography>
    </Box>
  );

  return compact ? (
    <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "action.hover", textAlign: "left" }}>
      {content}
    </Box>
  ) : (
    <Card sx={{ p: { xs: 2.5, sm: 3 } }}>{content}</Card>
  );
}

export default TelegramFollow;
