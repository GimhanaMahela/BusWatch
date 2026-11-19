"use client";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Box, Card, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { WhatsAppButton } from "@/components/atoms";
import useContactChannels from "@/hooks/useContactChannels";
import { WHATSAPP_GREEN } from "@/lib/whatsapp";

/**
 * "Get updates on WhatsApp": opens a chat with the BusWatch bot with "Track <receipt ID>" ready to
 * send. The bot answers with the status and a button to follow the report. Hidden when the bot
 * isn't set up.
 */
function WhatsAppFollow({ receiptId, compact = false }: { receiptId: string; compact?: boolean }) {
  const t = useTranslations("whatsapp");
  if (!useContactChannels()?.whatsapp) return null;

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
      >
        <WhatsAppIcon fontSize="small" sx={{ color: WHATSAPP_GREEN }} />
        {t("followTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("followText")}
      </Typography>
      <WhatsAppButton
        label={t("followButton")}
        message={t("followMessage", { receiptId })}
        variant="outlined"
        sx={{ mt: 1.5, alignSelf: "flex-start" }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        {t("followHint")}
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

export default WhatsAppFollow;
