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
import type { ReactNode } from "react";
import { GradientButton } from "@/components/atoms";
import { HeroBand } from "@/components/templates";

const IMPACTS: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <HealthAndSafetyRoundedIcon />,
    title: "Enhanced safety",
    text: "Helping identify and fix hazards before someone gets hurt.",
  },
  {
    icon: <ScheduleRoundedIcon />,
    title: "Improved punctuality",
    text: "Pinpointing skipped halts and missed schedules for more reliable service.",
  },
  {
    icon: <VerifiedRoundedIcon />,
    title: "Better service quality",
    text: "Encouraging higher standards of vehicle maintenance and professionalism.",
  },
  {
    icon: <AccessibilityNewRoundedIcon />,
    title: "Accessibility",
    text: "Surfacing the challenges faced by passengers with disabilities.",
  },
  {
    icon: <GroupsRoundedIcon />,
    title: "Community empowerment",
    text: "Giving every commuter a voice that is recorded and followed up.",
  },
];

const CONTACTS = [
  { icon: <EmailRoundedIcon />, label: "info@buswatch.com", href: "mailto:info@buswatch.com" },
  { icon: <PhoneRoundedIcon />, label: "+94 76 838 9990", href: "tel:+94768389990" },
  { icon: <LocationOnRoundedIcon />, label: "Matale, Sri Lanka" },
];

function AboutUsView() {
  return (
    <>
      <HeroBand
        eyebrow="About BusWatch"
        title="Driving better commutes, together."
        subtitle="We believe every voice matters in shaping a more efficient, safer and friendlier public transport system."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" color="primary" component="p">
              Our mission
            </Typography>
            <Typography variant="h4" component="h2">
              Empowering commuters
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              Our mission is to give daily commuters a simple tool to report, track and influence
              the quality of public bus services. By bridging the gap between passengers and
              transport authorities, we aim for a transparent, responsive network where feedback
              turns into real improvements.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" color="primary" component="p">
              Our vision
            </Typography>
            <Typography variant="h4" component="h2">
              A future of seamless commutes
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              We envision public transport that is consistently excellent, comfortable and reliable,
              with BusWatch as the leading platform for passenger advocacy and continuous
              improvement, driven by the insights of the community it serves.
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="h4" component="h2" sx={{ mt: { xs: 8, md: 12 }, mb: 3 }}>
          Why it matters
        </Typography>
        <Grid container spacing={2.5}>
          {IMPACTS.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ p: 3, height: "100%" }}>
                <Box sx={{ color: "primary.main", "& svg": { fontSize: 30 } }}>{item.icon}</Box>
                <Typography variant="h6" component="h3" sx={{ mt: 1.5 }}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {item.text}
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
                Seen something on a bus? Your report is the first step.
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
                Report an incident
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
              Get in touch
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              We&apos;d love to hear from you.
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
            {CONTACTS.map((c) => (
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
