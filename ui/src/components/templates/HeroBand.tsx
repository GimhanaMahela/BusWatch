import { Box, Container, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface HeroBandProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

/** Page-top band with a soft brand glow, used by public pages under the header. */
function HeroBand({ eyebrow, title, subtitle, children }: HeroBandProps) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderBottom: 1,
        borderColor: "divider",
        background:
          "radial-gradient(60% 120% at 15% 0%, rgba(var(--mui-palette-primary-mainChannel) / 0.14) 0%, transparent 60%), radial-gradient(50% 100% at 90% 10%, rgba(var(--mui-palette-secondary-mainChannel) / 0.12) 0%, transparent 60%)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        {eyebrow && (
          <Typography variant="overline" color="primary" component="p">
            {eyebrow}
          </Typography>
        )}
        <Typography
          variant="h2"
          component="h1"
          sx={{ fontSize: { xs: "2.1rem", md: "3rem" }, maxWidth: 800 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            color="text.secondary"
            sx={{ mt: 2, fontSize: { md: "1.15rem" }, maxWidth: 640 }}
          >
            {subtitle}
          </Typography>
        )}
        {children}
      </Container>
    </Box>
  );
}

export default HeroBand;
