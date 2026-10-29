import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";

const BAR_COLOR = "primary.main";
const BAR_HOVER_COLOR = "primary.dark";

// Horizontal bars: label | bar | value. The whole row is the hover/click target.
function HorizontalBarList({ rows, emptyText = "No data yet.", unit = "reports" }) {
  if (!rows.length || rows.every((r) => r.value === 0)) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {rows.map((row) => (
        <Tooltip
          key={row.key}
          title={`${row.label}: ${row.value} ${unit}`}
          placement="top"
          followCursor
        >
          <Box
            component="li"
            onClick={row.onClick}
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(90px, 38%) 1fr 40px",
              alignItems: "center",
              gap: 1.5,
              py: 0.75,
              cursor: row.onClick ? "pointer" : "default",
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
              "&:hover .bar": { bgcolor: BAR_HOVER_COLOR },
            }}
          >
            <Typography
              variant="body2"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pl: 0.5 }}
            >
              {row.label}
            </Typography>
            <Box sx={{ height: 14, display: "flex", alignItems: "center" }}>
              <Box
                className="bar"
                sx={{
                  height: 14,
                  width: `${(row.value / max) * 100}%`,
                  minWidth: row.value > 0 ? 4 : 0,
                  bgcolor: BAR_COLOR,
                  // Rounded data end only; flat edge on the baseline
                  borderRadius: "0 4px 4px 0",
                  transition: "background-color 0.15s",
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right", pr: 0.5 }}>
              {row.value}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}

export default HorizontalBarList;
