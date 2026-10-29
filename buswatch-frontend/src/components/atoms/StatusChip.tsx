import { Chip, type ChipProps } from "@mui/material";
import { statusColor, statusLabel } from "../../constants/reportConstants";

interface StatusChipProps extends Omit<ChipProps, "label" | "color"> {
  status: string;
  uppercase?: boolean;
}

/** Coloured chip for a report status. */
function StatusChip({ status, uppercase = false, sx, ...chipProps }: StatusChipProps) {
  const label = statusLabel(status);
  return (
    <Chip
      label={uppercase ? label.toUpperCase() : label}
      color={statusColor(status)}
      sx={[{ fontWeight: 700 }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...chipProps}
    />
  );
}

export default StatusChip;
