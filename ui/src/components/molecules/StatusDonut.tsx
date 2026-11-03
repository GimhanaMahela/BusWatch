"use client";

import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { STATUSES, type ReportStatus } from "@/constants/reportConstants";

const STATUS_FILL: Record<ReportStatus, string> = {
  pending: "var(--mui-palette-warning-main)",
  reviewed: "var(--mui-palette-info-main)",
  escalated: "var(--mui-palette-secondary-main)",
  resolved: "var(--mui-palette-success-main)",
  rejected: "var(--mui-palette-text-disabled)",
};

interface StatusDonutProps {
  byStatus: Record<ReportStatus, number>;
  onSelect?: (status: ReportStatus) => void;
}

/** Donut of reports by status, with a legend that doubles as a filter. */
function StatusDonut({ byStatus, onSelect }: StatusDonutProps) {
  const total = STATUSES.reduce((sum, s) => sum + (byStatus[s.value] || 0), 0);
  const data = STATUSES.map((s, id) => ({
    id,
    value: byStatus[s.value] || 0,
    label: s.label,
    color: STATUS_FILL[s.value],
  }));

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
      <Box sx={{ position: "relative", width: 200, height: 200, mx: { xs: "auto", sm: 0 } }}>
        <PieChart
          width={200}
          height={200}
          hideLegend
          margin={0}
          series={[
            {
              data,
              innerRadius: 62,
              outerRadius: 96,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
            },
          ]}
          onItemClick={(_, item) => {
            const status = STATUSES[item.dataIndex]?.value;
            if (status && onSelect) onSelect(status);
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, lineHeight: 1 }}>
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              reports
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, flex: 1, minWidth: 180 }}>
        {STATUSES.map((s) => {
          const count = byStatus[s.value] || 0;
          return (
            <Box
              component="li"
              key={s.value}
              onClick={onSelect ? () => onSelect(s.value) : undefined}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                py: 0.75,
                px: 1,
                borderRadius: 2,
                cursor: onSelect ? "pointer" : "default",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: STATUS_FILL[s.value] }}
              />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {s.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {count}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 40, textAlign: "right" }}
              >
                {total ? Math.round((count / total) * 100) : 0}%
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default StatusDonut;
