import { Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

/** Headline number with a label and optional hint. */
function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }} elevation={2}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, lineHeight: 1.1 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

export default StatTile;
