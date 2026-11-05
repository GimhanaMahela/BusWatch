import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DirectionsBusFilledRoundedIcon from "@mui/icons-material/DirectionsBusFilledRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import PanToolRoundedIcon from "@mui/icons-material/PanToolRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import SentimentVeryDissatisfiedRoundedIcon from "@mui/icons-material/SentimentVeryDissatisfiedRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import { Box, Button, Card, Container, Grid, Typography } from "@mui/material";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { GradientButton } from "@/components/atoms";
import { ReceiptSearchForm } from "@/components/molecules";
import { CATEGORIES, type ComplaintCategory } from "@/constants/reportConstants";
import busHero from "../../../public/bus-hero.jpg";

const CATEGORY_ICONS: Record<ComplaintCategory, ReactNode> = {
  reckless_driving: <SpeedRoundedIcon />,
  overcharging: <LocalAtmRoundedIcon />,
  no_ticket: <ConfirmationNumberRoundedIcon />,
  refused_to_stop: <PanToolRoundedIcon />,
  harassment: <ReportProblemRoundedIcon />,
  overcrowding: <GroupsRoundedIcon />,
  loud_music: <MusicOffRoundedIcon />,
  vehicle_condition: <BuildRoundedIcon />,
  staff_behaviour: <SentimentVeryDissatisfiedRoundedIcon />,
  other: <MoreHorizRoundedIcon />,
};

const STEPS = [
  { icon: <EditNoteRoundedIcon />, key: "step1" },
  { icon: <ReceiptLongRoundedIcon />, key: "step2" },
  { icon: <TimelineRoundedIcon />, key: "step3" },
] as const;

const PROMISES = ["promiseAccount", "promiseEmail", "promiseEvidence", "promiseLanguages"] as const;

const iconTile = (icon: ReactNode, size = 44) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: 3,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "primary.main",
      bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.1)",
    }}
  >
    {icon}
  </Box>
);

// Decorative card on the hero photo showing what a tracked report looks like
function ExampleReceipt() {
  const t = useTranslations("home");
  const steps = [t("stepReceived"), t("stepReviewed"), t("stepEscalated"), t("stepResolved")];
  return (
    <Card
      aria-hidden
      sx={{
        position: "absolute",
        left: { xs: 16, md: -40 },
        bottom: { xs: 16, md: 32 },
        width: { xs: "calc(100% - 32px)", sm: 320 },
        p: 2.5,
        borderRadius: 4,
        bgcolor: "rgba(var(--mui-palette-background-paperChannel) / 0.86)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 24px 48px -16px rgba(11, 18, 32, 0.35)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t("exampleReceipt")}
        </Typography>
        <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
          ● {t("exampleResolved")}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontWeight: 800,
          fontSize: "1.15rem",
          mt: 0.5,
        }}
      >
        BW-2026-7Q4KDN
      </Typography>
      <Box sx={{ display: "flex", gap: 0.75, mt: 2 }}>
        {steps.map((s) => (
          <Box key={s} sx={{ flex: 1 }}>
            <Box sx={{ height: 5, borderRadius: 3, bgcolor: "success.main" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.66rem" }}>
              {s}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

function HomeView() {
  const t = useTranslations("home");
  const tc = useTranslations("categories");
  return (
    <>
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(55% 80% at 0% 0%, rgba(var(--mui-palette-primary-mainChannel) / 0.16) 0%, transparent 70%), radial-gradient(45% 70% at 100% 20%, rgba(var(--mui-palette-secondary-mainChannel) / 0.14) 0%, transparent 70%)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  mb: 3,
                  borderRadius: 99,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <CampaignRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("badge")}
                </Typography>
              </Box>
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: "2.6rem", sm: "3.4rem", md: "4rem" } }}
              >
                {t("titleStart")}{" "}
                <Box
                  component="span"
                  sx={{
                    background: "linear-gradient(120deg, #5B83FF 0%, #2457F5 45%, #7A4DF0 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("titleHighlight")}
                </Box>
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 3, fontSize: { xs: "1.05rem", md: "1.2rem" }, maxWidth: 520 }}
              >
                {t("subtitle")}
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, mt: 4, flexWrap: "wrap" }}>
                <GradientButton
                  href="/submit-report"
                  size="large"
                  endIcon={<ArrowForwardRoundedIcon />}
                >
                  {t("reportCta")}
                </GradientButton>
                <Button
                  href="/track"
                  size="large"
                  variant="outlined"
                  color="inherit"
                  sx={{ borderColor: "divider" }}
                >
                  {t("trackCta")}
                </Button>
              </Box>
              <Box
                component="ul"
                sx={{
                  display: "flex",
                  gap: 2.5,
                  flexWrap: "wrap",
                  listStyle: "none",
                  p: 0,
                  mt: 4,
                  mb: 0,
                }}
              >
                {PROMISES.map((p) => (
                  <Box
                    component="li"
                    key={p}
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t(p)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: { xs: "4 / 3", md: "4 / 4.4" },
                    borderRadius: 6,
                    overflow: "hidden",
                    boxShadow: "0 40px 80px -32px rgba(11, 18, 32, 0.45)",
                  }}
                >
                  <Image
                    src={busHero}
                    alt={t("heroAlt")}
                    fill
                    priority
                    placeholder="blur"
                    sizes="(max-width: 900px) 100vw, 560px"
                    style={{ objectFit: "cover" }}
                  />
                </Box>
                <ExampleReceipt />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Quick tracking */}
      <Container maxWidth="lg">
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            display: "grid",
            gridTemplateColumns: { md: "1fr 1.3fr" },
            gap: 3,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h5" component="h2">
              {t("quickTrackTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {t("quickTrackText")}
            </Typography>
          </Box>
          <ReceiptSearchForm />
        </Card>
      </Container>

      {/* How it works */}
      <Container maxWidth="lg" component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="overline" color="primary" component="p">
          {t("howEyebrow")}
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, maxWidth: 640 }}>
          {t("howTitle")}
        </Typography>
        <Grid container spacing={3} sx={{ mt: 4 }}>
          {STEPS.map((step, index) => (
            <Grid key={step.key} size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3.5, height: "100%", position: "relative", overflow: "hidden" }}>
                <Typography
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 20,
                    fontSize: "4.5rem",
                    fontWeight: 800,
                    color: "action.hover",
                    lineHeight: 1,
                  }}
                >
                  {index + 1}
                </Typography>
                {iconTile(step.icon, 48)}
                <Typography variant="h6" component="h3" sx={{ mt: 2.5 }}>
                  {t(`${step.key}Title`)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {t(`${step.key}Text`)}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Categories */}
      <Box
        component="section"
        sx={{ bgcolor: "background.paper", borderBlock: 1, borderColor: "divider" }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="overline" color="primary" component="p">
                {t("categoriesEyebrow")}
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.4rem" } }}>
                {t("categoriesTitle")}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {t("categoriesText")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                {CATEGORIES.map((c) => (
                  <Box
                    key={c.value}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 3,
                      border: 1,
                      borderColor: "divider",
                      bgcolor: "background.default",
                    }}
                  >
                    {iconTile(CATEGORY_ICONS[c.value], 40)}
                    <Typography sx={{ fontWeight: 600 }}>{tc(c.value)}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Commend a driver */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 } }}>
        <Card
          sx={{
            p: { xs: 3, md: 5 },
            display: "grid",
            gridTemplateColumns: { md: "auto 1fr auto" },
            gap: { xs: 2.5, md: 4 },
            alignItems: "center",
            borderColor: "rgba(var(--mui-palette-success-mainChannel) / 0.35)",
            background:
              "linear-gradient(120deg, rgba(var(--mui-palette-success-mainChannel) / 0.08) 0%, transparent 60%)",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 4,
              display: "grid",
              placeItems: "center",
              color: "success.main",
              bgcolor: "rgba(var(--mui-palette-success-mainChannel) / 0.14)",
            }}
          >
            <ThumbUpAltRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: "success.main" }} component="p">
              {t("commendEyebrow")}
            </Typography>
            <Typography variant="h4" component="h2">
              {t("commendTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>
              {t("commendText")}
            </Typography>
          </Box>
          <Button
            href="/commend-a-driver"
            size="large"
            variant="contained"
            color="success"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ justifySelf: { md: "end" } }}
          >
            {t("commendCta")}
          </Button>
        </Card>
      </Container>

      {/* Closing call to action */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 6,
            p: { xs: 4, md: 8 },
            color: "common.white",
            background: "linear-gradient(130deg, #1638B8 0%, #2457F5 50%, #7A4DF0 100%)",
          }}
        >
          <DirectionsBusFilledRoundedIcon
            aria-hidden
            sx={{
              position: "absolute",
              right: { xs: -40, md: 40 },
              bottom: -40,
              fontSize: 260,
              opacity: 0.12,
            }}
          />
          <GavelRoundedIcon sx={{ fontSize: 36, opacity: 0.9 }} />
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "1.9rem", md: "2.6rem" }, mt: 2, maxWidth: 620 }}
          >
            {t("closingTitle")}
          </Typography>
          <Typography sx={{ mt: 2, opacity: 0.85, maxWidth: 520, fontSize: "1.05rem" }}>
            {t("closingText")}
          </Typography>
          <Button
            href="/submit-report"
            size="large"
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              mt: 4,
              bgcolor: "common.white",
              color: "#1638B8",
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            {t("closingCta")}
          </Button>
        </Box>
      </Container>
    </>
  );
}

export default HomeView;
