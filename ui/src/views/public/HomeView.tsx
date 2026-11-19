import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DirectionsBusFilledRoundedIcon from "@mui/icons-material/DirectionsBusFilledRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import PanToolRoundedIcon from "@mui/icons-material/PanToolRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import SentimentVeryDissatisfiedRoundedIcon from "@mui/icons-material/SentimentVeryDissatisfiedRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import AccessibleRoundedIcon from "@mui/icons-material/AccessibleRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Box, Button, Container, Typography } from "@mui/material";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { GradientButton, GradientText, RouteLines, WhatsAppButton } from "@/components/atoms";
import { BentoTile, ReceiptSearchForm } from "@/components/molecules";
import { WhatsAppTile } from "@/components/organisms";
import { CATEGORIES, type ComplaintCategory } from "@/constants/reportConstants";
import type { PublicImpact } from "@/types/public";
import busHero from "../../../public/bus-hero.jpg";

// The home page is a bento grid: tiles of different sizes fitted together. 12 columns on desktop,
// 2 on tablets and 1 on phones; each tile sets its span per breakpoint.

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
  accessibility: <AccessibleRoundedIcon />,
  other: <MoreHorizRoundedIcon />,
};

const TONES = ["primary", "secondary", "info", "success", "warning", "error"] as const;
type Tone = (typeof TONES)[number];

const STEPS = [
  { icon: <EditNoteRoundedIcon />, key: "step1" },
  { icon: <ReceiptLongRoundedIcon />, key: "step2" },
  { icon: <TimelineRoundedIcon />, key: "step3" },
] as const;

const PROMISES = ["promiseAccount", "promiseEmail", "promiseEvidence", "promiseLanguages"] as const;

/** Column / row spans: phones always 1 column; `sm` out of 2 columns; `md` out of 12. */
const span = (sm: 1 | 2, md: number, rows = 1) => ({
  gridColumn: { xs: "span 1", sm: `span ${sm}`, md: `span ${md}` },
  gridRow: { md: rows > 1 ? `span ${rows}` : undefined },
});

const tint = (tone: Tone, alpha: number) =>
  `rgba(var(--mui-palette-${tone}-mainChannel) / ${alpha})`;

const iconTile = (icon: ReactNode, tone: Tone = "primary", size = 42) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: 3,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: `${tone}.main`,
      bgcolor: tint(tone, 0.12),
      boxShadow: `inset 0 0 0 1px ${tint(tone, 0.16)}`,
    }}
  >
    {icon}
  </Box>
);

/** Small label at the top of a tile, with a gradient dash. */
function TileLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <Typography
      variant="overline"
      component="p"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        lineHeight: 2,
        color: light ? "rgba(255 255 255 / 0.85)" : "primary.main",
        "&::before": {
          content: '""',
          width: 18,
          height: 3,
          borderRadius: 3,
          background: light ? "rgba(255 255 255 / 0.85)" : "var(--bw-gradient-brand)",
        },
      }}
    >
      {children}
    </Typography>
  );
}

/** Decorative tracked-report card (also the fallback tile when the WhatsApp bot is off). */
function ExampleReceipt() {
  const t = useTranslations("home");
  const steps = [t("stepReceived"), t("stepReviewed"), t("stepEscalated"), t("stepResolved")];
  return (
    <Box aria-hidden>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t("exampleReceipt")}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "success.main",
            fontWeight: 700,
            px: 1,
            py: 0.25,
            borderRadius: 99,
            bgcolor: tint("success", 0.12),
          }}
        >
          ● {t("exampleResolved")}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontWeight: 800,
          fontSize: "1.2rem",
          mt: 0.75,
          letterSpacing: "0.02em",
        }}
      >
        BW-2026-7Q4KDN
      </Typography>
      <Box sx={{ display: "flex", gap: 0.75, mt: 2 }}>
        {steps.map((s) => (
          <Box key={s} sx={{ flex: 1 }}>
            <Box sx={{ height: 6, borderRadius: 3, background: "var(--bw-gradient-brand)" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.66rem" }}>
              {s}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** Live figures from the Impact page, or what BusWatch promises when they can't be loaded. */
function StatsTile({ impact }: { impact: PublicImpact | null }) {
  const t = useTranslations("home");
  const ti = useTranslations("impact");
  const format = useFormatter();
  const totals = impact?.totals;
  const figures = totals
    ? [
        { label: ti("received"), value: format.number(totals.received) },
        { label: ti("resolved"), value: format.number(totals.resolved) },
        {
          label: ti("resolutionRate"),
          value: totals.resolutionRate === null ? "–" : `${totals.resolutionRate}%`,
        },
        { label: ti("commendations"), value: format.number(totals.commendations) },
      ]
    : null;

  return (
    <BentoTile variant="brand" sx={{ ...span(1, 4), display: "flex", flexDirection: "column" }}>
      <InsightsRoundedIcon
        aria-hidden
        sx={{ position: "absolute", right: -18, top: -18, fontSize: 140, opacity: 0.12 }}
      />
      <TileLabel light>{t("statsTitle")}</TileLabel>
      {figures ? (
        <Box
          component="dl"
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, m: 0, mt: 1.5, flex: 1 }}
        >
          {figures.map((figure) => (
            <Box key={figure.label}>
              <Typography component="dt" variant="body2" sx={{ opacity: 0.85, lineHeight: 1.3 }}>
                {figure.label}
              </Typography>
              <Typography
                component="dd"
                sx={{
                  m: 0,
                  mt: 0.25,
                  fontFamily: "var(--font-display), var(--font-sans), sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "1.8rem", md: "2.1rem" },
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                }}
              >
                {figure.value}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 1.5, flex: 1 }}>
          {PROMISES.map((p) => (
            <Box
              component="li"
              key={p}
              sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5, fontWeight: 600 }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
              {t(p)}
            </Box>
          ))}
        </Box>
      )}
      <Button
        href="/impact"
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{
          mt: 2,
          alignSelf: "flex-start",
          color: "common.white",
          bgcolor: "rgba(255 255 255 / 0.16)",
          "&:hover": { bgcolor: "rgba(255 255 255 / 0.26)" },
        }}
      >
        {t("statsLink")}
      </Button>
    </BentoTile>
  );
}

function HomeView({ impact = null }: { impact?: PublicImpact | null }) {
  const t = useTranslations("home");
  const tc = useTranslations("categories");
  const tw = useTranslations("whatsapp");

  return (
    <Box>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 6, md: 10 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(12, 1fr)" },
            gridAutoFlow: "dense",
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {/* Hero: the big tile */}
          <BentoTile
            sx={{
              ...span(2, 7, 2),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: { xs: 3, sm: 4, md: 6 },
              backgroundImage:
                "radial-gradient(90% 70% at 0% 0%, rgba(var(--mui-palette-primary-mainChannel) / 0.1), transparent 60%)",
            }}
          >
            <RouteLines
              sx={{
                display: { xs: "none", md: "block" },
                position: "absolute",
                right: -200,
                bottom: -150,
                width: 520,
                opacity: 0.3,
              }}
            />
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  pl: 0.75,
                  pr: 1.75,
                  py: 0.5,
                  mb: 3,
                  borderRadius: 99,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: 99,
                    display: "grid",
                    placeItems: "center",
                    color: "common.white",
                    background: "var(--bw-gradient-brand)",
                  }}
                >
                  <CampaignRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  {t("badge")}
                </Typography>
              </Box>
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: "2.6rem", sm: "3.4rem", md: "4rem" } }}
              >
                {t("titleStart")} <GradientText>{t("titleHighlight")}</GradientText>
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2.5, fontSize: { xs: "1.05rem", md: "1.15rem" }, maxWidth: 520 }}
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
                <WhatsAppButton
                  label={tw("chatButton")}
                  message={tw("hello")}
                  size="large"
                  variant="outlined"
                />
              </Box>
              <Box
                component="ul"
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  listStyle: "none",
                  p: 0,
                  mt: 3.5,
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
            </Box>
          </BentoTile>

          {/* Photo */}
          <BentoTile
            sx={{
              ...span(1, 5),
              p: 0,
              minHeight: { xs: 220, md: 260 },
              border: 0,
            }}
          >
            <Image
              src={busHero}
              alt={t("heroAlt")}
              fill
              priority
              placeholder="blur"
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 480px"
              style={{ objectFit: "cover" }}
            />
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 45%, rgba(var(--bw-glow) / 0.55) 100%)",
              }}
            />
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                left: 16,
                bottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 1,
                pl: 0.75,
                pr: 1.75,
                py: 0.75,
                borderRadius: 99,
                bgcolor: "rgba(var(--mui-palette-background-paperChannel) / 0.88)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 99,
                  display: "grid",
                  placeItems: "center",
                  color: "common.white",
                  background: "var(--bw-gradient-brand)",
                }}
              >
                <VerifiedRoundedIcon sx={{ fontSize: 17 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t("heroChecked")}
              </Typography>
            </Box>
          </BentoTile>

          {/* Quick tracking */}
          <BentoTile
            variant="tint"
            sx={{
              ...span(1, 5),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 2 }}>
              {iconTile(<ReceiptLongRoundedIcon />)}
              <Box>
                <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3 }}>
                  {t("quickTrackTitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("quickTrackText")}
                </Typography>
              </Box>
            </Box>
            <ReceiptSearchForm />
          </BentoTile>

          {/* Live figures */}
          <StatsTile impact={impact} />

          {/* How it works */}
          <BentoTile sx={span(2, 5)}>
            <TileLabel>{t("howEyebrow")}</TileLabel>
            <Typography variant="h5" component="h2" sx={{ mt: 0.5 }}>
              {t("howTitle")}
            </Typography>
            <Box
              component="ol"
              sx={{ listStyle: "none", p: 0, m: 0, mt: 2.5, display: "grid", gap: 2 }}
            >
              {STEPS.map((step, index) => (
                <Box component="li" key={step.key} sx={{ display: "flex", gap: 1.75 }}>
                  <Box
                    sx={{
                      position: "relative",
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      color: "common.white",
                      background: "var(--bw-gradient-brand)",
                      boxShadow: "0 10px 20px -12px rgba(var(--bw-glow) / 0.9)",
                      "& svg": { fontSize: 21 },
                    }}
                  >
                    {step.icon}
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 20,
                        height: 20,
                        borderRadius: 99,
                        display: "grid",
                        placeItems: "center",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: "primary.main",
                        bgcolor: "background.paper",
                        border: 2,
                        borderColor: "primary.main",
                      }}
                    >
                      {index + 1}
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{t(`${step.key}Title`)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(`${step.key}Text`)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </BentoTile>

          {/* Commend a driver */}
          <BentoTile
            variant="tint"
            tone="success"
            interactive
            sx={{ ...span(2, 3), display: "flex", flexDirection: "column" }}
          >
            {iconTile(<ThumbUpAltRoundedIcon />, "success", 48)}
            <Typography variant="overline" component="p" sx={{ color: "success.main", mt: 2 }}>
              {t("commendEyebrow")}
            </Typography>
            <Typography variant="h6" component="h2" sx={{ lineHeight: 1.25 }}>
              {t("commendTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, flex: 1 }}>
              {t("commendText")}
            </Typography>
            <Button
              href="/commend-a-driver"
              variant="contained"
              color="success"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ mt: 2, alignSelf: "flex-start" }}
            >
              {t("commendCta")}
            </Button>
          </BentoTile>

          {/* What you can report */}
          <BentoTile sx={span(2, 7)}>
            <TileLabel>{t("categoriesEyebrow")}</TileLabel>
            <Typography variant="h5" component="h2" sx={{ mt: 0.5 }}>
              {t("categoriesTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
              {t("categoriesText")}
            </Typography>
            <Box
              component="ul"
              sx={{
                listStyle: "none",
                p: 0,
                m: 0,
                mt: 2.5,
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {CATEGORIES.map((c, index) => {
                const tone = TONES[index % TONES.length]!;
                return (
                  <Box
                    component="li"
                    key={c.value}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      pl: 0.75,
                      pr: 1.75,
                      py: 0.75,
                      borderRadius: 99,
                      border: 1,
                      borderColor: tint(tone, 0.25),
                      bgcolor: tint(tone, 0.06),
                    }}
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 99,
                        display: "grid",
                        placeItems: "center",
                        color: `${tone}.main`,
                        bgcolor: tint(tone, 0.14),
                        "& svg": { fontSize: 17 },
                      }}
                    >
                      {CATEGORY_ICONS[c.value]}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 650 }}>
                      {tc(c.value)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </BentoTile>

          {/* Chat on WhatsApp, or an example receipt when the bot is off */}
          <WhatsAppTile
            sx={span(2, 5)}
            fallback={
              <BentoTile
                variant="tint"
                sx={{ ...span(2, 5), display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Box>
                  <TileLabel>{t("step3Title")}</TileLabel>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {t("step3Text")}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    mt: "auto",
                    p: 2.5,
                    borderRadius: 4,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    boxShadow: "var(--bw-shadow-card)",
                  }}
                >
                  <ExampleReceipt />
                </Box>
              </BentoTile>
            }
          />

          {/* More help: safety mode, lost and found, fare checker */}
          {(
            [
              {
                key: "safety",
                href: "/safety",
                icon: <ShieldRoundedIcon />,
                tone: "secondary",
                sx: span(1, 4),
              },
              {
                key: "lost",
                href: "/lost-something",
                icon: <TravelExploreRoundedIcon />,
                tone: "info",
                sx: span(1, 4),
              },
              {
                key: "fare",
                href: "/fare-check",
                icon: <PaymentsRoundedIcon />,
                tone: "primary",
                sx: span(2, 4),
              },
            ] as const
          ).map((tile) => (
            <BentoTile
              key={tile.key}
              interactive
              sx={{ ...tile.sx, display: "flex", flexDirection: "column" }}
            >
              {iconTile(tile.icon, tile.tone, 44)}
              <Typography variant="h6" component="h2" sx={{ mt: 2, lineHeight: 1.25 }}>
                {t(`${tile.key}Title`)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, flex: 1 }}>
                {t(`${tile.key}Text`)}
              </Typography>
              <Button
                href={tile.href}
                color={tile.tone}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ mt: 1.5, alignSelf: "flex-start", px: 0 }}
              >
                {t(`${tile.key}Cta`)}
              </Button>
            </BentoTile>
          ))}

          {/* Closing call to action */}
          <BentoTile
            variant="deep"
            sx={{
              ...span(2, 12),
              p: { xs: 3.5, md: 6 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { md: "center" },
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            <RouteLines
              sx={{
                position: "absolute",
                right: -40,
                bottom: -60,
                width: 520,
                opacity: 0.4,
                filter: "brightness(2.4) saturate(0.5)",
              }}
            />
            <DirectionsBusFilledRoundedIcon
              aria-hidden
              sx={{ position: "absolute", right: 32, bottom: -40, fontSize: 220, opacity: 0.1 }}
            />
            <Box sx={{ position: "relative", maxWidth: 640 }}>
              <Typography
                variant="h3"
                component="h2"
                sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" } }}
              >
                {t("closingTitle")}
              </Typography>
              <Typography sx={{ mt: 1.5, opacity: 0.85, fontSize: "1.05rem" }}>
                {t("closingText")}
              </Typography>
            </Box>
            <Button
              href="/submit-report"
              size="large"
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                position: "relative",
                flexShrink: 0,
                alignSelf: { xs: "flex-start", md: "center" },
                bgcolor: "common.white",
                color: "primary.dark",
                boxShadow: "0 14px 30px -12px rgba(0 0 0 / 0.5)",
                "&:hover": { bgcolor: "grey.100", transform: "translateY(-1px)" },
              }}
            >
              {t("closingCta")}
            </Button>
          </BentoTile>
        </Box>
      </Container>
    </Box>
  );
}

export default HomeView;
