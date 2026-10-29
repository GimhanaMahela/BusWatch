import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Grid,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getReportStats } from "../../api/reportApi";
import {
  HorizontalBarList,
  LoadingState,
  MonthlyColumnChart,
  SectionPanel,
  StatTile,
} from "../../components/molecules";
import { STATUSES, categoryLabel, statusLabel } from "../../constants/reportConstants";

function AnalyticsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getReportStats());
    } catch (err) {
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toDashboard = (params) =>
    navigate(`/admin/dashboard?${new URLSearchParams(params).toString()}`);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/dashboard")}
          >
            Reports
          </Button>
          <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 700 }}>
            Analytics
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {loading && !stats && (
        <LoadingState message="Loading statistics..." minHeight="50vh" />
      )}

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatTile label="Total reports" value={stats.total} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatTile label="Open" value={stats.open} hint="Pending, reviewed or escalated" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatTile label="Last 30 days" value={stats.last30Days} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatTile
              label="Average time to resolve"
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
              <Alert
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{ borderRadius: 3, "& .MuiAlert-message": { width: "100%" } }}
              >
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  Repeat offenders: 3 or more reports in the last 30 days
                </Typography>
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
                        <TableCell align="right">{bus.count}</TableCell>
                        <TableCell>{new Date(bus.lastReportedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Alert>
            </Grid>
          )}

          <Grid size={12}>
            <SectionPanel title="Reports per month" subtitle="Last 12 months">
              <MonthlyColumnChart data={stats.byMonth} />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel title="By category" subtitle="Click a row to see those reports">
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

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel title="By status" subtitle="Click a row to see those reports">
              <HorizontalBarList
                rows={STATUSES.map((st) => ({
                  key: st.value,
                  label: statusLabel(st.value),
                  value: stats.byStatus[st.value] || 0,
                  onClick: () => toDashboard({ status: st.value }),
                }))}
              />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel title="Most reported routes" subtitle="All time, top 10">
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

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel title="Most reported buses" subtitle="All time, top 10">
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
    </Container>
  );
}

export default AnalyticsPage;
