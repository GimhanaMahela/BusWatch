"use client";

import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/api/apiClient";
import {
  HorizontalBarList,
  LoadingState,
  MonthlyTrendChart,
  PageHeader,
  SectionPanel,
  StatTile,
  StatusDonut,
} from "@/components/molecules";
import { categoryLabel } from "@/constants/reportConstants";
import { useReportStats } from "@/hooks/useReportQueries";
import { formatDateTime } from "@/lib/format";

function AnalyticsView() {
  const router = useRouter();
  const { data: stats, isPending, isFetching, error, refetch } = useReportStats();

  const toDashboard = (params: Record<string, string>) =>
    router.push(`/admin/dashboard?${new URLSearchParams(params).toString()}`);

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        subtitle="Click any bar, slice or row to see the matching reports."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void refetch()}
            loading={isFetching}
          >
            Refresh
          </Button>
        }
      />

      {isPending && !error && <LoadingState message="Loading statistics..." minHeight="50vh" />}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage(error, "Failed to load statistics")}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, lg: 3 }}>
            <StatTile label="Total reports" value={stats.total} icon={<InboxRoundedIcon />} />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <StatTile
              label="Open"
              value={stats.open}
              hint="Pending, reviewed or escalated"
              icon={<AssignmentLateRoundedIcon />}
              tone="secondary"
            />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <StatTile
              label="Last 30 days"
              value={stats.last30Days}
              icon={<CalendarMonthRoundedIcon />}
              tone="info"
            />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <StatTile
              label="Avg. time to resolve"
              tone="success"
              icon={<TimerRoundedIcon />}
              value={
                stats.avgResolutionHours === null
                  ? "–"
                  : stats.avgResolutionHours >= 48
                    ? `${Math.round(stats.avgResolutionHours / 24)}d`
                    : `${stats.avgResolutionHours}h`
              }
              hint={
                stats.resolvedWithTiming
                  ? `Across ${stats.resolvedWithTiming} resolved reports`
                  : "No resolved reports with timing yet"
              }
            />
          </Grid>

          {stats.repeatOffenders.length > 0 && (
            <Grid size={12}>
              <Card
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderColor: "warning.main",
                  bgcolor: "rgba(var(--mui-palette-warning-mainChannel) / 0.06)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <WarningAmberRoundedIcon sx={{ color: "warning.main" }} />
                  <Box>
                    <Typography variant="h6" component="h2" sx={{ fontSize: "1.05rem" }}>
                      Repeat offenders
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Buses with 3 or more reports in the last 30 days
                    </Typography>
                  </Box>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Bus number</TableCell>
                      <TableCell align="right">Reports (30 days)</TableCell>
                      <TableCell>Last reported</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.repeatOffenders.map((bus) => (
                      <TableRow
                        key={bus.busNumber}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => toDashboard({ q: bus.busNumber })}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>{bus.busNumber}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "warning.main" }}>
                          {bus.count}
                        </TableCell>
                        <TableCell>{formatDateTime(bus.lastReportedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Grid>
          )}

          <Grid size={{ xs: 12, lg: 8 }}>
            <SectionPanel
              title="Reports per month"
              subtitle="Last 12 months"
              icon={<ShowChartRoundedIcon fontSize="small" />}
            >
              <MonthlyTrendChart data={stats.byMonth} />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <SectionPanel title="By status" icon={<DonutLargeRoundedIcon fontSize="small" />}>
              <StatusDonut
                byStatus={stats.byStatus}
                onSelect={(status) => toDashboard({ status })}
              />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <SectionPanel title="By category" icon={<CategoryRoundedIcon fontSize="small" />}>
              <HorizontalBarList
                rows={stats.byCategory.map((c) => ({
                  key: c.category,
                  label: categoryLabel(c.category),
                  value: c.count,
                  onClick: () => toDashboard({ category: c.category }),
                }))}
              />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <SectionPanel
              title="Most reported routes"
              subtitle="All time, top 10"
              icon={<RouteRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                rows={stats.topRoutes.map((r) => ({
                  key: r.routeNumber,
                  label: `Route ${r.routeNumber}`,
                  value: r.count,
                  onClick: () => toDashboard({ q: r.routeNumber }),
                }))}
              />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <SectionPanel
              title="Most reported buses"
              subtitle="All time, top 10"
              icon={<DirectionsBusRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                rows={stats.topBuses.map((b) => ({
                  key: b.busNumber,
                  label: b.busName ? `${b.busNumber} · ${b.busName}` : b.busNumber,
                  value: b.count,
                  onClick: () => toDashboard({ q: b.busNumber }),
                }))}
              />
            </SectionPanel>
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default AnalyticsView;
