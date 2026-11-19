import { Box, Container, Divider, Grid, Link as MuiLink, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BrandMark, RouteLines, WhatsAppButton } from "@/components/atoms";
import { InstallAppButton } from "@/components/molecules";

const COLUMNS = [
  {
    title: "passengers",
    links: [
      { key: "report", href: "/submit-report" },
      { key: "commend", href: "/commend-a-driver" },
      { key: "track", href: "/track" },
      { key: "myReports", href: "/my-reports" },
      { key: "safety", href: "/safety" },
      { key: "lost", href: "/lost-something" },
      { key: "fare", href: "/fare-check" },
    ],
  },
  {
    title: "buswatch",
    links: [
      { key: "impact", href: "/impact" },
      { key: "about", href: "/about-us" },
      { key: "adminSignIn", href: "/admin/login" },
    ],
  },
  {
    title: "legal",
    links: [
      { key: "privacy", href: "/privacy-policy" },
      { key: "terms", href: "/terms-of-service" },
    ],
  },
] as const;

/** Site-wide footer: a deep band in the theme's colours, with link columns and app links. */
function SiteFooter() {
  const t = useTranslations("footer");
  const tw = useTranslations("whatsapp");
  return (
    <Box
      component="footer"
      sx={{
        position: "relative",
        overflow: "hidden",
        mt: "auto",
        color: "rgba(255 255 255 / 0.92)",
        background: "var(--bw-gradient-deep)",
        // Darken the bright end so the links stay easy to read
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0 0 0 / 0.15) 0%, rgba(0 0 0 / 0.45) 100%)",
        },
      }}
    >
      <RouteLines
        sx={{
          position: "absolute",
          right: -80,
          bottom: -60,
          width: 640,
          opacity: 0.35,
          filter: "brightness(2.2) saturate(0.6)",
        }}
      />
      <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 6, md: 8 } }}>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 5 }}>
            <BrandMark tone="light" />
            <Typography sx={{ mt: 2, maxWidth: 340, color: "rgba(255 255 255 / 0.75)" }}>
              {t("tagline")}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 3 }}>
              <WhatsAppButton label={tw("footer")} message={tw("hello")} />
              <InstallAppButton
                sx={{
                  color: "common.white",
                  borderColor: "rgba(255 255 255 / 0.45)",
                  "&:hover": {
                    borderColor: "common.white",
                    bgcolor: "rgba(255 255 255 / 0.08)",
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }} container spacing={3}>
            {COLUMNS.map((column) => (
              <Grid key={column.title} size={{ xs: 6, sm: 4 }}>
                <Typography variant="overline" sx={{ color: "rgba(255 255 255 / 0.6)" }}>
                  {t(column.title)}
                </Typography>
                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 1 }}>
                  {column.links.map((link) => (
                    <Box component="li" key={link.href} sx={{ py: 0.5 }}>
                      <MuiLink
                        href={link.href}
                        underline="hover"
                        sx={{ fontWeight: 500, color: "rgba(255 255 255 / 0.9)" }}
                      >
                        {t(link.key)}
                      </MuiLink>
                    </Box>
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, borderColor: "rgba(255 255 255 / 0.15)" }} />
        <Typography variant="body2" sx={{ color: "rgba(255 255 255 / 0.65)" }}>
          © {new Date().getFullYear()} BusWatch · {t("madeFor")}
        </Typography>
      </Container>
    </Box>
  );
}

export default SiteFooter;
