import { Box, Card, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface SectionPanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Buttons or links shown at the top right */
  action?: ReactNode;
  children: ReactNode;
}

/** Card with a title row, used to frame a chart, list or form. */
function SectionPanel({ title, subtitle, icon, action, children }: SectionPanelProps) {
  return (
    <Card sx={{ p: { xs: 2.5, sm: 3 }, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2.5 }}>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: "primary.main",
              bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.1)",
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h2" sx={{ fontSize: "1.05rem", lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Card>
  );
}

export default SectionPanel;
