"use client";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

/** Switches between light and dark mode (the first visit follows the system setting). */
function ColorModeToggle() {
  const t = useTranslations("common");
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = mode === "system" ? systemMode : mode;
  const next = resolved === "dark" ? "light" : "dark";
  const label = next === "dark" ? t("switchToDark") : t("switchToLight");

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() => setMode(next)}
        sx={{ border: 1, borderColor: "divider", borderRadius: 2.5 }}
      >
        {/* Before hydration the mode is unknown; render a stable icon */}
        {resolved === "dark" ? (
          <LightModeOutlinedIcon fontSize="small" />
        ) : (
          <DarkModeOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default ColorModeToggle;
