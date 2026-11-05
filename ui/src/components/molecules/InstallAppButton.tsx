"use client";

import InstallMobileRoundedIcon from "@mui/icons-material/InstallMobileRounded";
import { Button, Tooltip, type ButtonProps } from "@mui/material";
import { useTranslations } from "next-intl";
import useInstallPrompt from "@/hooks/useInstallPrompt";

/** "Install the app": only rendered when the browser offers installation. */
function InstallAppButton(props: Omit<ButtonProps, "onClick">) {
  const t = useTranslations("install");
  const { available, install } = useInstallPrompt();
  if (!available) return null;
  return (
    <Tooltip title={t("hint")}>
      <Button
        variant="outlined"
        startIcon={<InstallMobileRoundedIcon />}
        onClick={() => void install()}
        {...props}
      >
        {t("button")}
      </Button>
    </Tooltip>
  );
}

export default InstallAppButton;
