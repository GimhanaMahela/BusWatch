import { Box, Card, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "success" | "warning" | "error" | "info";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
}

/** Headline number with a label, a tinted icon and an optional hint. */
function StatTile({ label, value, hint, icon, tone = "primary" }: StatTileProps) {
  return (
    <Card sx={{ p: 2.5, height: "100%", position: "relative", overflow: "hidden" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              color: `${tone}.main`,
              bgcolor: `rgba(var(--mui-palette-${tone}-mainChannel) / 0.12)`,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: { xs: "1.9rem", md: "2.2rem" },
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Card>
  );
}

export default StatTile;
