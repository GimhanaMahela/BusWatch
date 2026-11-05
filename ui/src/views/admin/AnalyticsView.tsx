"use client";

import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import TelegramIcon from "@mui/icons-material/Telegram";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
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
  Divider,
  Grid,
  Rating,
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
import { categoryLabel, languageLabel, LANGUAGES } from "@/constants/reportConstants";
import { useReportStats } from "@/hooks/useReportQueries";
import { formatDateTime, timeAgo } from "@/lib/format";

const formatHours = (hours: number | null) =>
  hours === null ? "–" : hours >= 48 ? `${Math.round(hours / 24)}d` : `${hours}h`;

const SectionHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Box sx={{ mt: 3 }}>
    <Typography variant="h5" component="h2">
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {subtitle}
    </Typography>
  </Box>
);

function AnalyticsView() {
  const router = useRouter();
  const { data: stats, isPending, isFetching, error, refetch } = useReportStats();
  const engagement = stats?.engagement;

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

      {stats && engagement && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, lg: 3 }}>
            <StatTile
              label="Total reports"
              value={stats.total}
              hint="Complaints; commendations are counted below"
              icon={<InboxRoundedIcon />}
            />
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
              value={formatHours(stats.avgResolutionHours)}
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

          {/* ------------------------------------------------ Phase 1 success metrics */}
          <Grid size={12}>
            <SectionHeading
              title="Passenger engagement"
              subtitle={`Last ${engagement.periodDays} days. Counts are anonymous daily totals.`}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4, xl: "grow" }}>
            <StatTile
              label="Form completion"
              tone="primary"
              icon={<TaskAltRoundedIcon />}
              value={
                engagement.formCompletionRate === null ? "–" : `${engagement.formCompletionRate}%`
              }
              hint={`${engagement.formSubmits} sent of ${engagement.formStarts} started`}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4, xl: "grow" }}>
            <StatTile
              label="Return visits to tracking"
              tone="info"
              icon={<ReplayRoundedIcon />}
              value={engagement.trackingReturnViews}
              hint={`Of ${engagement.trackingViews} tracking page visits`}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4, xl: "grow" }}>
            <StatTile
              label="Average outcome rating"
              tone="warning"
              icon={<StarRoundedIcon />}
              value={engagement.avgRating === null ? "–" : `${engagement.avgRating} / 5`}
              hint={
                engagement.ratingsCount
                  ? `From ${engagement.ratingsCount} rating${engagement.ratingsCount === 1 ? "" : "s"} (all time)`
                  : "No ratings yet"
              }
            />
          </Grid>
          <Grid size={{ xs: 6, md: 6, xl: "grow" }}>
            <StatTile
              label="Reports from QR codes"
              tone="secondary"
              icon={<QrCode2RoundedIcon />}
              value={engagement.qrReports}
              hint={`${engagement.qrScans} sticker scans · ${engagement.webReports} sent from the website`}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, xl: "grow" }}>
            <StatTile
              label="Time to first response"
              tone="success"
              icon={<TimerRoundedIcon />}
              value={formatHours(engagement.avgFirstResponseHours)}
              hint={
                engagement.respondedReports
                  ? `Average over ${engagement.respondedReports} answered reports`
                  : "No admin responses in this period"
              }
            />
          </Grid>

          {/* ------------------------------------------------ Phase 3: two-way contact */}
          <Grid size={12}>
            <SectionHeading
              title="Two-way contact"
              subtitle={`Last ${engagement.periodDays} days. Time to first response counts status updates and messages.`}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label="Messages to passengers"
              tone="primary"
              icon={<ForumRoundedIcon />}
              value={engagement.adminMessages}
              hint="Questions and replies from the team"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label="Passenger replies"
              tone="info"
              icon={<ReplyRoundedIcon />}
              value={engagement.passengerMessages}
              hint="Sent from the tracking page"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label="My reports sign-ins"
              tone="secondary"
              icon={<LockOpenRoundedIcon />}
              value={engagement.myReportsSignins}
              hint="With a one-time code by email or SMS"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label="Devices following reports"
              tone="success"
              icon={<NotificationsActiveRoundedIcon />}
              value={engagement.pushSubscriptions}
              hint="New browser notification sign-ups"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label="Telegram followers"
              tone="info"
              icon={<TelegramIcon />}
              value={engagement.telegramLinks}
              hint="Chats that pressed Start on the bot"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <SectionPanel
              title="Outcome ratings"
              subtitle="How passengers rated closed complaints"
              icon={<StarRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                unit="ratings"
                emptyText="No ratings yet."
                rows={[...engagement.ratingDistribution].reverse().map((r) => ({
                  key: String(r.rating),
                  label: `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`,
                  value: r.count,
                }))}
              />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <SectionPanel
              title="Recent feedback"
              subtitle="Comments left with a rating"
              icon={<ForumRoundedIcon fontSize="small" />}
            >
              {engagement.recentFeedback.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No written feedback yet.
                </Typography>
              ) : (
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  {engagement.recentFeedback.map((f, i) => (
                    <Box key={f.id}>
                      {i > 0 && <Divider sx={{ mb: 1.5 }} />}
                      <Box
                        component="button"
                        type="button"
                        onClick={() => router.push(`/admin/reports/${f.id}`)}
                        sx={{
                          all: "unset",
                          cursor: "pointer",
                          display: "block",
                          width: "100%",
                          "&:hover .receipt": { color: "primary.main" },
                          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Rating value={f.rating} readOnly size="small" />
                          <Typography
                            className="receipt"
                            variant="caption"
                            sx={{ fontFamily: "ui-monospace, monospace", fontWeight: 700 }}
                          >
                            {f.receiptId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                            {timeAgo(f.ratedAt)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {f.feedback}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <SectionPanel
              title="Reach"
              subtitle="Reports by language (30 days), sharing and app installs"
              icon={<TranslateRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                rows={LANGUAGES.map((l) => ({
                  key: l.value,
                  label: languageLabel(l.value),
                  value: engagement.byLanguage[l.value],
                }))}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 0.75 }}>
                {[
                  ["Tracking links shared", engagement.shares],
                  ["Reports saved offline, sent later", engagement.offlineQueued],
                  ["App installs", engagement.appInstalls],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </SectionPanel>
          </Grid>

          {/* ------------------------------------------------ Commend a driver */}
          <Grid size={12}>
            <SectionHeading
              title="Commendations"
              subtitle="Praise for drivers and crews, kept apart from complaint statistics."
            />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <StatTile
              label="Total commendations"
              value={stats.commendations.total}
              tone="success"
              icon={<ThumbUpAltRoundedIcon />}
            />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <StatTile
              label="Last 30 days"
              value={stats.commendations.last30Days}
              tone="info"
              icon={<CalendarMonthRoundedIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <StatTile
              label="Waiting to be passed on"
              value={stats.commendations.open}
              hint="Pending, reviewed or escalated commendations"
              tone="secondary"
              icon={<InsightsRoundedIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel
              title="What passengers praised"
              icon={<CategoryRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                rows={stats.commendations.byCategory.map((c) => ({
                  key: c.category,
                  label: categoryLabel(c.category),
                  value: c.count,
                  onClick: () => toDashboard({ type: "commendation", category: c.category }),
                }))}
              />
            </SectionPanel>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel
              title="Most commended buses"
              subtitle="All time, top 10"
              icon={<DirectionsBusRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                rows={stats.commendations.topBuses.map((b) => ({
                  key: b.busNumber,
                  label: b.busName ? `${b.busNumber} · ${b.busName}` : b.busNumber,
                  value: b.count,
                  onClick: () => toDashboard({ type: "commendation", q: b.busNumber }),
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
