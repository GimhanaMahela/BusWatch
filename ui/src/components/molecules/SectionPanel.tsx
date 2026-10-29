import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface SectionPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Card with a title and optional subtitle, used to frame a chart or list. */
function SectionPanel({ title, subtitle, children }: SectionPanelProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }} elevation={2}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  );
}

export default SectionPanel;
