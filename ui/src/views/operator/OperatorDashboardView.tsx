"use client";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
  Alert,
  Button,
  Box,
  Card,
  CardActionArea,
  Chip,
  Grid,
  MenuItem,
  Pagination,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { errorMessage } from "@/api/apiClient";
import { StatusChip } from "@/components/atoms";
import { EmptyState, LoadingState, PageHeader, StatTile } from "@/components/molecules";
import { PUBLIC_STATUSES, categoryLabel, statusLabel } from "@/constants/reportConstants";
import useAuth from "@/hooks/useAuth";
import { useFleetReports, useFleetSummary } from "@/hooks/useOperatorQueries";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { FleetReport } from "@/types/operator";

const PAGE_SIZE = 10;

function FleetReportCard({ report }: { report: FleetReport }) {
  const commendation = report.type === "commendation";
  const lost = report.type === "lost_item";
  const awaiting = !commendation && report.status !== "resolved" && (report.responses ?? 0) === 0;
  return (
    <Card>
      <CardActionArea href={`/operator/reports/${report.id}`} sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {commendation ? (
            <ThumbUpAltRoundedIcon color="success" fontSize="small" />
          ) : lost ? (
            <TravelExploreRoundedIcon color="info" fontSize="small" />
          ) : (
            <ReportProblemRoundedIcon color="warning" fontSize="small" />
          )}
          <Typography sx={{ fontWeight: 700 }}>
            {report.busNumber} · Route {report.routeNumber}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {categoryLabel(report.category)}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <StatusChip status={report.status} size="small" />
        </Box>
        <Typography
          color="text.secondary"
          sx={{
            mt: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {report.description}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            title={formatDateTime(report.reportedAt) ?? undefined}
          >
            Reported {timeAgo(report.reportedAt)}
          </Typography>
          {report.confirmations > 0 && (
            <Chip
              size="small"
              icon={<GroupsRoundedIcon />}
              label={`${report.confirmations} confirmed`}
              variant="outlined"
            />
          )}
          {(report.responses ?? 0) > 0 && (
            <Chip
              size="small"
              icon={<ChatBubbleOutlineRoundedIcon />}
              label="You responded"
              color="success"
              variant="outlined"
            />
          )}
          {awaiting && <Chip size="small" label="Awaiting your response" color="warning" />}
        </Box>
      </CardActionArea>
    </Card>
  );
}

function OperatorDashboardView() {
  const { admin } = useAuth();
  const summary = useFleetSummary();
  const [type, setType] = useState<"" | "complaint" | "commendation" | "lost_item">("complaint");
  const [status, setStatus] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [page, setPage] = useState(1);
  const reports = useFleetReports({
    page,
    limit: PAGE_SIZE,
    type: type || undefined,
    status: status || undefined,
    busNumber: busNumber || undefined,
  });

  const filter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  if (summary.isPending) return <LoadingState message="Loading your fleet..." />;
  if (summary.error) {
    return (
      <Alert severity="error">{errorMessage(summary.error, "Could not load your fleet.")}</Alert>
    );
  }
  const s = summary.data;

  return (
    <>
      <PageHeader
        eyebrow={admin?.organisation ?? "Operator portal"}
        title="Reports about your buses"
        subtitle="Only reports the TransitX team has checked appear here. Passengers' names and contact details are never shared."
      />

      {s.fleet.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No buses are linked to your account yet. Ask the TransitX team to add your bus numbers.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Awaiting your response"
            tone="warning"
            icon={<PendingActionsRoundedIcon />}
            value={s.awaitingResponse}
            hint="Open complaints you haven't answered"
          />
        </Grid>
        {s.lostItemsOpen > 0 && (
          <Grid size={12} sx={{ order: -1 }}>
            <Alert
              severity="info"
              icon={<TravelExploreRoundedIcon />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => filter(() => setType("lost_item"))}
                >
                  Show
                </Button>
              }
            >
              {s.lostItemsOpen === 1
                ? "A passenger is looking for something they left on one of your buses."
                : `${s.lostItemsOpen} passengers are looking for things they left on your buses.`}
            </Alert>
          </Grid>
        )}
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Checked complaints"
            tone="error"
            icon={<ReportProblemRoundedIcon />}
            value={s.complaints}
            hint={`${s.complaintsByStatus.resolved} resolved`}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Commendations"
            tone="success"
            icon={<ThumbUpAltRoundedIcon />}
            value={s.commendations}
            hint="Praise for your drivers and crew"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Last 30 days"
            tone="info"
            icon={<TimelineRoundedIcon />}
            value={s.last30Days}
            hint="Reports of any kind"
          />
        </Grid>
      </Grid>

      {s.fleet.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 3 }}>
          <DirectionsBusRoundedIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
            Your fleet:
          </Typography>
          {s.fleet.map((bus) => (
            <Chip
              key={bus}
              size="small"
              label={bus}
              variant={busNumber === bus ? "filled" : "outlined"}
              color={busNumber === bus ? "primary" : "default"}
              onClick={() => filter(() => setBusNumber(busNumber === bus ? "" : bus))}
            />
          ))}
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Tabs value={type} onChange={(_, value: typeof type) => filter(() => setType(value))}>
          <Tab value="complaint" label="Complaints" />
          <Tab value="commendation" label="Commendations" />
          <Tab
            value="lost_item"
            label={s.lostItemsOpen ? `Lost items (${s.lostItemsOpen})` : "Lost items"}
          />
          <Tab value="" label="All" />
        </Tabs>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => filter(() => setStatus(e.target.value))}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Any status</MenuItem>
          {PUBLIC_STATUSES.map((value) => (
            <MenuItem key={value} value={value}>
              {statusLabel(value)}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {reports.error && (
        <Alert severity="error">{errorMessage(reports.error, "Could not load reports.")}</Alert>
      )}
      {reports.data && reports.data.reports.length === 0 && (
        <Card>
          <EmptyState
            icon={<InboxRoundedIcon />}
            title="No reports here"
            description="Nothing matches these filters yet."
          />
        </Card>
      )}
      <Box sx={{ display: "grid", gap: 1.5, opacity: reports.isPlaceholderData ? 0.6 : 1 }}>
        {reports.data?.reports.map((report) => (
          <FleetReportCard key={report.id} report={report} />
        ))}
      </Box>
      {reports.data && reports.data.pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={reports.data.pages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </>
  );
}

export default OperatorDashboardView;
