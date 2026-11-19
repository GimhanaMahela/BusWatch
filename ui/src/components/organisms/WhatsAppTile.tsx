"use client";

import MicRoundedIcon from "@mui/icons-material/MicRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { WhatsAppButton } from "@/components/atoms";
import { BentoTile } from "@/components/molecules";
import useContactChannels from "@/hooks/useContactChannels";
import { WHATSAPP_GREEN } from "@/lib/whatsapp";

/**
 * Bento tile inviting passengers to chat with the WhatsApp bot. When the bot isn't set up, the
 * `fallback` tile is shown in its place so the grid keeps its shape.
 */
function WhatsAppTile({ fallback, sx }: { fallback: ReactNode; sx?: object }) {
  const t = useTranslations("whatsapp");
  if (!useContactChannels()?.whatsapp) return <>{fallback}</>;

  return (
    <BentoTile
      sx={{
        ...sx,
        display: "flex",
        flexDirection: "column",
        borderColor: "rgba(37 211 102 / 0.35)",
        backgroundImage:
          "radial-gradient(110% 90% at 100% 0%, rgba(37 211 102 / 0.18), transparent 60%)",
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 3.5,
          display: "grid",
          placeItems: "center",
          color: "common.white",
          bgcolor: WHATSAPP_GREEN,
          boxShadow: "0 12px 24px -12px rgba(37 211 102 / 0.9)",
        }}
      >
        <WhatsAppIcon />
      </Box>
      <Typography variant="h5" component="h2" sx={{ mt: 2 }}>
        {t("chatTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, flex: 1 }}>
        {t("chatText")}
      </Typography>
      <Stack direction="row" sx={{ gap: 1, mt: 2, color: "text.secondary" }} aria-hidden>
        {[
          <MicRoundedIcon key="mic" />,
          <PhotoCameraRoundedIcon key="photo" />,
          <PlaceRoundedIcon key="place" />,
        ].map((icon) => (
          <Box
            key={icon.key}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 99,
              display: "grid",
              placeItems: "center",
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              "& svg": { fontSize: 19 },
            }}
          >
            {icon}
          </Box>
        ))}
      </Stack>
      <WhatsAppButton
        label={t("chatButton")}
        message={t("hello")}
        size="large"
        sx={{ mt: 2.5, alignSelf: "flex-start" }}
      />
    </BentoTile>
  );
}

export default WhatsAppTile;
