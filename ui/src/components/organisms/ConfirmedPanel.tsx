"use client";

import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { GradientButton } from "@/components/atoms";
import { ResultCard } from "@/components/molecules";

/** Shown after a passenger confirmed an existing report ("me too") instead of filing their own. */
function ConfirmedPanel({ busNumber, onReset }: { busNumber: string; onReset: () => void }) {
  const t = useTranslations("meToo");
  return (
    <ResultCard icon={<GroupsRoundedIcon />} color="success">
      <Typography variant="h4" component="h1" sx={{ mt: 3 }}>
        {t("thanksTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5 }}>
        {t("thanksText", { bus: busNumber })}
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap", mt: 3 }}>
        <GradientButton href="/">{t("home")}</GradientButton>
        <Button onClick={onReset}>{t("reportDifferent")}</Button>
      </Box>
    </ResultCard>
  );
}

export default ConfirmedPanel;
