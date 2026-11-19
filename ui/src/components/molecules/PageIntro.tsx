import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type IntroColor = "primary" | "success" | "secondary" | "info" | "warning" | "error";

interface PageIntroProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  color?: IntroColor;
}

/** Centred icon, eyebrow, title and subtitle at the top of a passenger page. */
function PageIntro({ icon, eyebrow, title, subtitle, color = "primary" }: PageIntroProps) {
  return (
    <Box sx={{ textAlign: "center", mb: 4 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: "auto",
          mb: 2,
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          color: `${color}.main`,
          bgcolor: `rgba(var(--mui-palette-${color}-mainChannel) / 0.14)`,
          "& svg": { fontSize: 32 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="overline" sx={{ color: `${color}.main` }} component="p">
        {eyebrow}
      </Typography>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.4rem" } }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 580, mx: "auto" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export default PageIntro;
