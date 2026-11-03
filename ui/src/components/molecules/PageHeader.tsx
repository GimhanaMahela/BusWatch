import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Small label above the title */
  eyebrow?: string;
  actions?: ReactNode;
}

/** Title block at the top of an admin screen, with actions on the right. */
function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "flex-end" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography variant="overline" color="primary" sx={{ display: "block", lineHeight: 2 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: "1.6rem", md: "2rem" } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box>}
    </Box>
  );
}

export default PageHeader;
