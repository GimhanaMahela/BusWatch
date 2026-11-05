import { Chip, type ChipProps } from "@mui/material";
import { statusColor, statusLabel } from "@/constants/reportConstants";

interface StatusChipProps extends Omit<ChipProps, "label" | "color"> {
  status: string;
  uppercase?: boolean;
  /** Translated label (public pages); admin screens use the English default */
  label?: string;
}

/** Tinted chip with a status dot for a report status. */
function StatusChip({
  status,
  uppercase = false,
  label: labelOverride,
  sx,
  ...chipProps
}: StatusChipProps) {
  const label = labelOverride ?? statusLabel(status);
  const color = statusColor(status);
  return (
    <Chip
      label={uppercase ? label.toUpperCase() : label}
      sx={[
        {
          fontWeight: 700,
          color: color === "default" ? "text.secondary" : `${color}.main`,
          bgcolor: `rgba(var(--mui-palette-${color === "default" ? "text-secondary" : `${color}-main`}Channel) / 0.12)`,
          "&::before": {
            content: '""',
            width: 7,
            height: 7,
            ml: 1.25,
            mr: -0.25,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: "currentColor",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...chipProps}
    />
  );
}

export default StatusChip;
