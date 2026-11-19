"use client";

import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import { Card, Container, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageIntro } from "@/components/molecules";
import { FareChecker } from "@/components/organisms";
import { fareReportHref } from "@/lib/fareLink";

/** Fare checker: the official fare between two stops, and a one-click overcharging report. */
function FareCheckView() {
  const t = useTranslations("fare");
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <PageIntro
        icon={<PaymentsRoundedIcon />}
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <Card sx={{ p: { xs: 2.5, sm: 4 } }}>
        <FareChecker
          onReport={(selection, result) =>
            router.push(fareReportHref(selection, result.routeNumber))
          }
        />
      </Card>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
        {t("howItWorks")}
      </Typography>
    </Container>
  );
}

export default FareCheckView;
