"use client";

import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { BarChart } from "@mui/x-charts/BarChart";
import { useLocale } from "next-intl";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface ImpactTrendChartProps {
  /** One row per month: { month: "YYYY-MM", [series.key]: number } */
  data: ({ month: string } & Record<string, number | string>)[];
  series: TrendSeries[];
}

/** Month-by-month columns for one or more series, labelled in the site language. */
function ImpactTrendChart({ data, series }: ImpactTrendChartProps) {
  const locale = useLocale();
  const monthLabel = (key: string, style: "short" | "long" = "short") => {
    const [year = 1970, month = 1] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(locale, {
      month: style,
      ...(style === "long" ? { year: "numeric" } : {}),
    });
  };

  return (
    <Box>
      <BarChart
        height={280}
        dataset={data}
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
        series={series.map((s) => ({ dataKey: s.key, label: s.label, color: s.color }))}
        borderRadius={6}
        grid={{ horizontal: true }}
        hideLegend={series.length < 2}
        margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
      />
      <Table size="small" sx={visuallyHidden}>
        <TableHead>
          <TableRow>
            <TableCell />
            {series.map((s) => (
              <TableCell key={s.key}>{s.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((d) => (
            <TableRow key={d.month}>
              <TableCell>{monthLabel(d.month, "long")}</TableCell>
              {series.map((s) => (
                <TableCell key={s.key}>{d[s.key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default ImpactTrendChart;
