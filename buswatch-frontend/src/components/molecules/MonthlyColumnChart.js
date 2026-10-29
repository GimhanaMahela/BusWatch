import React from "react";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { visuallyHidden } from "@mui/utils";

const BAR_COLOR = "primary.main";
const BAR_HOVER_COLOR = "primary.dark";

const monthLabel = (key, style = "short") => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: style,
    ...(style === "long" ? { year: "numeric" } : {}),
  });
};

// Vertical columns for the 12-month trend
function MonthlyColumnChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);
  const last = data[data.length - 1];
  const chartHeight = 180;

  return (
    <Box>
      <Box
        role="img"
        aria-label={`Reports per month. Peak ${peak.count} in ${monthLabel(peak.month, "long")}; ${last.count} this month.`}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "2px",
          height: chartHeight + 20,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {data.map((d) => {
          const showLabel = d.count > 0 && (d === peak || d === last);
          return (
            <Tooltip
              key={d.month}
              title={`${monthLabel(d.month, "long")}: ${d.count} reports`}
              placement="top"
            >
              <Box
                sx={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  cursor: "default",
                  "&:hover .col": { bgcolor: BAR_HOVER_COLOR },
                }}
              >
                {showLabel && (
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.25 }}>
                    {d.count}
                  </Typography>
                )}
                <Box
                  className="col"
                  sx={{
                    width: "70%",
                    maxWidth: 36,
                    height: `${(d.count / max) * chartHeight}px`,
                    minHeight: d.count > 0 ? 4 : 0,
                    bgcolor: BAR_COLOR,
                    borderRadius: "4px 4px 0 0",
                    transition: "background-color 0.15s",
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", gap: "2px", mt: 0.5 }}>
        {data.map((d) => (
          <Typography
            key={d.month}
            variant="caption"
            color="text.secondary"
            sx={{ flex: 1, textAlign: "center", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}
          >
            {monthLabel(d.month)}
          </Typography>
        ))}
      </Box>
      <Table size="small" sx={visuallyHidden}>
        <TableHead>
          <TableRow>
            <TableCell>Month</TableCell>
            <TableCell>Reports</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((d) => (
            <TableRow key={d.month}>
              <TableCell>{monthLabel(d.month, "long")}</TableCell>
              <TableCell>{d.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default MonthlyColumnChart;
