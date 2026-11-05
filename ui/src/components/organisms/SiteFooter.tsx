import { Box, Container, Divider, Grid, Link as MuiLink, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/atoms";
import { InstallAppButton } from "@/components/molecules";

const COLUMNS = [
  {
    title: "passengers",
    links: [
      { key: "report", href: "/submit-report" },
      { key: "commend", href: "/commend-a-driver" },
      { key: "track", href: "/track" },
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

/** Site-wide footer with link columns. */
function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <Box
      component="footer"
      sx={{ mt: "auto", borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 5 }}>
            <BrandMark />
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 340 }}>
              {t("tagline")}
            </Typography>
            <InstallAppButton sx={{ mt: 2.5 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }} container spacing={3}>
            {COLUMNS.map((column) => (
              <Grid key={column.title} size={{ xs: 6, sm: 4 }}>
                <Typography variant="overline" color="text.secondary">
                  {t(column.title)}
                </Typography>
                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 1 }}>
                  {column.links.map((link) => (
                    <Box component="li" key={link.href} sx={{ py: 0.5 }}>
                      <MuiLink
                        href={link.href}
                        underline="hover"
                        color="text.primary"
                        sx={{ fontWeight: 500 }}
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
        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} BusWatch · {t("madeFor")}
        </Typography>
      </Container>
    </Box>
  );
}

export default SiteFooter;
