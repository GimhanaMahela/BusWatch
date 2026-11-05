"use client";

import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import { Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { ResultCard } from "@/components/molecules";
import type { ReportType } from "@/constants/reportConstants";

/** Shown when there was no connection: the report waits on the device and goes out later. */
function QueuedPanel({ onReset, type }: { onReset: () => void; type: ReportType }) {
  const t = useTranslations("offline");
  const ts = useTranslations("success");
  return (
    <ResultCard icon={<CloudDoneRoundedIcon />} color="info">
      <Typography variant="h4" component="h1" sx={{ mt: 3 }}>
        {t("queuedTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5 }}>
        {t("queuedText")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        {t("queuedHint")}
      </Typography>
      <Button onClick={onReset} sx={{ mt: 3 }}>
        {type === "commendation" ? ts("anotherCommendation") : ts("another")}
      </Button>
    </ResultCard>
  );
}

export default QueuedPanel;
