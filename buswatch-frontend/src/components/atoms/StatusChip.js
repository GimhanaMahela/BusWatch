import React from "react";
import { Chip } from "@mui/material";
import { statusColor, statusLabel } from "../../constants/reportConstants";

/** Coloured chip for a report status. */
function StatusChip({ status, uppercase = false, sx, ...chipProps }) {
  const label = statusLabel(status);
  return (
    <Chip
      label={uppercase ? label.toUpperCase() : label}
      color={statusColor(status)}
      sx={{ fontWeight: 700, ...sx }}
      {...chipProps}
    />
  );
}

export default StatusChip;
