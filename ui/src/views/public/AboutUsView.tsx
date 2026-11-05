import AccessibilityNewRoundedIcon from "@mui/icons-material/AccessibilityNewRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import FacebookIcon from "@mui/icons-material/Facebook";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Box, Card, Container, Grid, IconButton, Link as MuiLink, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { GradientButton } from "@/components/atoms";
import { HeroBand } from "@/components/templates";

const IMPACTS: {
  icon: ReactNode;
  key: "safety" | "punctuality" | "quality" | "accessibility" | "community";
}[] = [
  { icon: <HealthAndSafetyRoundedIcon />, key: "safety" },
  { icon: <ScheduleRoundedIcon />, key: "punctuality" },
  { icon: <VerifiedRoundedIcon />, key: "quality" },
  { icon: <AccessibilityNewRoundedIcon />, key: "accessibility" },
  { icon: <GroupsRoundedIcon />, key: "community" },
];

function AboutUsView() {
  const t = useTranslations("about");
  const contacts = [
    { icon: <EmailRoundedIcon />, label: "info@buswatch.com", href: "mailto:info@buswatch.com" },
    { icon: <PhoneRoundedIcon />, label: "+94 76 838 9990", href: "tel:+94768389990" },
    { icon: <LocationOnRoundedIcon />, label: t("location") },
  ];
  return (
    <>
      <HeroBand eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" color="primary" component="p">
              {t("missionEyebrow")}
            </Typography>
            <Typography variant="h4" component="h2">
              {t("missionTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              {t("missionText")}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" color="primary" component="p">
              {t("visionEyebrow")}
            </Typography>
            <Typography variant="h4" component="h2">
              {t("visionTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              {t("visionText")}
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="h4" component="h2" sx={{ mt: { xs: 8, md: 12 }, mb: 3 }}>
          {t("whyTitle")}
        </Typography>
        <Grid container spacing={2.5}>
          {IMPACTS.map((item) => (
            <Grid key={item.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ p: 3, height: "100%" }}>
                <Box sx={{ color: "primary.main", "& svg": { fontSize: 30 } }}>{item.icon}</Box>
                <Typography variant="h6" component="h3" sx={{ mt: 1.5 }}>
                  {t(`${item.key}Title`)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {t(`${item.key}Text`)}
                </Typography>
              </Card>
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 2,
                border: 0,
                color: "common.white",
                background: "linear-gradient(135deg, #2457F5 0%, #7A4DF0 100%)",
              }}
            >
              <Typography variant="h6" component="p">
                {t("ctaText")}
              </Typography>
              <GradientButton
                href="/submit-report"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  background: "rgba(255,255,255,0.18)",
                  boxShadow: "none",
                  "&:hover": { background: "rgba(255,255,255,0.28)" },
                }}
              >
                {t("ctaButton")}
              </GradientButton>
            </Card>
          </Grid>
        </Grid>

        <Card
          sx={{
            mt: { xs: 8, md: 12 },
            p: { xs: 3, md: 5 },
            display: "grid",
            gridTemplateColumns: { md: "1fr 1.4fr" },
            gap: 4,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" component="h2">
              {t("contactTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t("contactText")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <IconButton
                aria-label="Facebook"
                href="https://www.facebook.com/gimhana.mahela.premawardana/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ border: 1, borderColor: "divider" }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                aria-label="LinkedIn"
                href="https://www.linkedin.com/in/gimhanamahela/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ border: 1, borderColor: "divider" }}
              >
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {contacts.map((c) => (
              <Box
                key={c.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "action.hover",
                }}
              >
                <Box sx={{ color: "primary.main", display: "flex" }}>{c.icon}</Box>
                {c.href ? (
                  <MuiLink
                    href={c.href}
                    underline="hover"
                    color="text.primary"
                    sx={{ fontWeight: 600 }}
                  >
                    {c.label}
                  </MuiLink>
                ) : (
                  <Typography sx={{ fontWeight: 600 }}>{c.label}</Typography>
                )}
              </Box>
            ))}
          </Box>
        </Card>
      </Container>
    </>
  );
}

export default AboutUsView;
