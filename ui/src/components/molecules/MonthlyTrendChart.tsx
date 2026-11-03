"use client";

import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { BarChart } from "@mui/x-charts/BarChart";

export interface MonthCount {
  month: string; // "YYYY-MM"
  count: number;
}

const monthLabel = (key: string, style: "short" | "long" = "short") => {
  const [year = 1970, month = 1] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: style,
    ...(style === "long" ? { year: "numeric" } : {}),
  });
};

/** Column chart of reports per month, with a screen-reader table of the same data. */
function MonthlyTrendChart({ data }: { data: MonthCount[] }) {
  return (
    <Box>
      <BarChart
        height={260}
        dataset={data.map((d) => ({ month: d.month, count: d.count }))}
        xAxis={[
          {
            scaleType: "band",
            dataKey: "month",
            valueFormatter: (v: string, ctx) =>
              monthLabel(v, ctx.location === "tick" ? "short" : "long"),
            tickLabelStyle: { fontSize: 12 },
            disableLine: true,
            disableTicks: true,
          },
        ]}
        yAxis={[{ tickMinStep: 1, disableLine: true, disableTicks: true, width: 36 }]}
        series={[{ dataKey: "count", label: "Reports", color: "var(--mui-palette-primary-main)" }]}
        borderRadius={6}
        grid={{ horizontal: true }}
        hideLegend
        margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
      />
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

export default MonthlyTrendChart;
