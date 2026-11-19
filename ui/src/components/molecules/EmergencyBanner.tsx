"use client";

import CallRoundedIcon from "@mui/icons-material/CallRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { Alert, AlertTitle, Box, Button } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { EMERGENCY_NUMBERS, type EmergencyService } from "@/constants/emergency";
import { FIRST_SERVICE, type EmergencyKind } from "@/lib/emergency";

const ICONS: Record<EmergencyService, ReactNode> = {
  police: <LocalPoliceRoundedIcon />,
  ambulance: <LocalHospitalRoundedIcon />,
  fire: <LocalFireDepartmentRoundedIcon />,
};

interface EmergencyBannerProps {
  /** What was detected; the most useful number comes first. Null shows the numbers in order. */
  kind: EmergencyKind | null;
  onDismiss?: () => void;
  /** "alert" when something was detected; "calm" for the always-visible strip in safety mode */
  variant?: "alert" | "calm";
}

/** Emergency shortcut: big call buttons for 119, 1990 and 110 (tel: links work on any phone). */
function EmergencyBanner({ kind, onDismiss, variant = "alert" }: EmergencyBannerProps) {
  const t = useTranslations("emergency");
  const first = kind ? FIRST_SERVICE[kind] : null;
  const services = [...EMERGENCY_NUMBERS].sort(
    (a, b) => Number(b.key === first) - Number(a.key === first),
  );

  return (
    <Alert
      severity={variant === "alert" ? "error" : "warning"}
      variant={variant === "alert" ? "filled" : "outlined"}
      icon={<CallRoundedIcon />}
      role={variant === "alert" ? "alert" : "region"}
      aria-label={t("title")}
      sx={{ "& .MuiAlert-message": { width: "100%" } }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>
        {variant === "alert" ? t("title") : t("calmTitle")}
      </AlertTitle>
      {variant === "alert" ? t("text") : t("calmText")}
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        {services.map(({ key, number }) => (
          <Button
            key={key}
            href={`tel:${number}`}
            variant={variant === "alert" ? "contained" : "outlined"}
            color={variant === "alert" ? "inherit" : "error"}
            startIcon={ICONS[key]}
            sx={{
              justifyContent: "flex-start",
              fontWeight: 700,
              ...(variant === "alert" && { color: "error.main", bgcolor: "common.white" }),
            }}
          >
            {t(key, { number })}
          </Button>
        ))}
      </Box>
      {onDismiss && (
        <Button color="inherit" size="small" onClick={onDismiss} sx={{ mt: 1, px: 0 }}>
          {t("dismiss")}
        </Button>
      )}
    </Alert>
  );
}

export default EmergencyBanner;
