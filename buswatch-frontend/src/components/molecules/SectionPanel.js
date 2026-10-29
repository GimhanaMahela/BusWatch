import React from "react";
import { Box, Paper, Typography } from "@mui/material";

/** Card with a title and optional subtitle, used to frame a chart or list. */
function SectionPanel({ title, subtitle, children }) {
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
