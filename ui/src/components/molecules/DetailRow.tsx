import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

/** Label/value pair on one line, wrapping on narrow screens. */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1, py: 0.75, flexWrap: "wrap" }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {children}
      </Typography>
    </Box>
  );
}

export default DetailRow;
