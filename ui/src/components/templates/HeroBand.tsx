import { Box, Container, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { RouteLines } from "@/components/atoms";

interface HeroBandProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

/**
 * Page-top banner for public pages: a large rounded tile (matching the home page's bento grid)
 * with the theme's glow and a faint route-map pattern.
 */
function HeroBand({ eyebrow, title, subtitle, children }: HeroBandProps) {
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: { xs: "22px", md: "28px" },
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: "var(--bw-shadow-card)",
          backgroundImage:
            "radial-gradient(70% 140% at 0% 0%, rgba(var(--mui-palette-primary-mainChannel) / 0.14) 0%, transparent 62%), radial-gradient(55% 120% at 100% 0%, rgba(var(--mui-palette-secondary-mainChannel) / 0.14) 0%, transparent 62%)",
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 4, md: 6 },
        }}
      >
        <RouteLines
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            right: -60,
            top: -60,
            width: 560,
            opacity: 0.45,
          }}
        />
        <Box sx={{ position: "relative" }}>
          {eyebrow && (
            <Typography
              variant="overline"
              component="p"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                color: "primary.main",
                "&::before": {
                  content: '""',
                  width: 22,
                  height: 3,
                  borderRadius: 3,
                  background: "var(--bw-gradient-brand)",
                },
              }}
            >
              {eyebrow}
            </Typography>
          )}
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontSize: { xs: "2.1rem", md: "3rem" }, maxWidth: 760, mt: 0.5 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              color="text.secondary"
              sx={{ mt: 2, fontSize: { md: "1.1rem" }, maxWidth: 620 }}
            >
              {subtitle}
            </Typography>
          )}
          {children}
        </Box>
      </Box>
    </Container>
  );
}

export default HeroBand;
