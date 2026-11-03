import { Box, Container, Divider, Grid, Link as MuiLink, Typography } from "@mui/material";
import { BrandMark } from "@/components/atoms";

const COLUMNS = [
  {
    title: "Passengers",
    links: [
      { label: "Report an incident", href: "/submit-report" },
      { label: "Track a report", href: "/track" },
    ],
  },
  {
    title: "BusWatch",
    links: [
      { label: "About us", href: "/about-us" },
      { label: "Admin sign in", href: "/admin/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of service", href: "/terms-of-service" },
    ],
  },
];

/** Site-wide footer with link columns. */
function SiteFooter() {
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
              Your eye on public transport. Report incidents in minutes and follow every step until
              they are resolved.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }} container spacing={3}>
            {COLUMNS.map((column) => (
              <Grid key={column.title} size={{ xs: 6, sm: 4 }}>
                <Typography variant="overline" color="text.secondary">
                  {column.title}
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
                        {link.label}
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
          © {new Date().getFullYear()} BusWatch · Made for safer journeys in Sri Lanka.
        </Typography>
      </Container>
    </Box>
  );
}

export default SiteFooter;
