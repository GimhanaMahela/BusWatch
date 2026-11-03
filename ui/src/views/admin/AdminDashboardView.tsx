"use client";

import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { errorMessage } from "@/api/apiClient";
import { StatusChip } from "@/components/atoms";
import { EmptyState, PageHeader, StatTile } from "@/components/molecules";
import { CATEGORIES, STATUSES, categoryLabel } from "@/constants/reportConstants";
import useAuth from "@/hooks/useAuth";
import { useDeleteReport, useReportList, useReportStats } from "@/hooks/useReportQueries";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { Report, ReportListParams } from "@/types/report";

// Filters live in the URL so a filtered view survives "back" from a report and can be shared
const FILTER_KEYS = ["q", "status", "category", "from", "to"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  ...STATUSES.map((s) => ({ value: s.value as string, label: s.label })),
];

const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 700 };

function AdminDashboardView() {
  const { admin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, searchParams.get(k) ?? ""]),
  ) as Record<FilterKey, string>;
  const page = Math.max(parseInt(searchParams.get("page") ?? "", 10) || 1, 1);
  const limit = parseInt(searchParams.get("limit") ?? "", 10) || 20;

  const [searchInput, setSearchInput] = useState(filters.q);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const listParams: ReportListParams = { page: 1, limit: 20, ...Object.fromEntries(searchParams) };
  const reportList = useReportList(listParams);
  const stats = useReportStats();
  const deleteMutation = useDeleteReport();
  const data = reportList.data ?? { reports: [], total: 0 };
  const error = reportList.error ?? deleteMutation.error;

  const updateParams = (changes: Record<string, string | number | null | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    // Any filter change starts again from the first page
    if (!("page" in changes)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  // Debounce the free-text search
  useEffect(() => {
    if (searchInput === filters.q) return undefined;
    const timer = setTimeout(() => updateParams({ q: searchInput.trim() }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasFilters = FILTER_KEYS.some((k) => filters[k]);

  const clearFilters = () => {
    setSearchInput("");
    router.replace("?", { scroll: false });
  };

  const confirmDelete = () => {
    if (!reportToDelete) return;
    deleteMutation.mutate(reportToDelete.id, { onSettled: () => setReportToDelete(null) });
  };

  const tabCount = (value: string) => {
    if (!stats.data) return null;
    if (value === "") return stats.data.total;
    if (value === "open") return stats.data.open;
    return stats.data.byStatus[value as keyof typeof stats.data.byStatus] ?? 0;
  };

  const columns: GridColDef<Report>[] = [
    {
      field: "receiptId",
      headerName: "Receipt ID",
      minWidth: 170,
      flex: 0.9,
      renderCell: ({ value }) => (
        <Box component="span" sx={mono}>
          {value as string}
        </Box>
      ),
    },
    {
      field: "busNumber",
      headerName: "Bus",
      minWidth: 150,
      flex: 0.9,
      renderCell: ({ row }) => (
        <Box sx={{ lineHeight: 1.3, py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {row.busNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Route {row.routeNumber}
            {row.busName ? ` · ${row.busName}` : ""}
          </Typography>
        </Box>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 190,
      flex: 1.1,
      valueGetter: (value: string) => categoryLabel(value),
    },
    { field: "location", headerName: "Location", minWidth: 160, flex: 1 },
    {
      field: "reportedAt",
      headerName: "Reported",
      minWidth: 140,
      flex: 0.8,
      renderCell: ({ value }) => (
        <Tooltip title={formatDateTime(value as string)} placement="top">
          <span>{timeAgo(value as string)}</span>
        </Tooltip>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      renderCell: ({ value }) => <StatusChip status={value as string} size="small" />,
    },
    {
      field: "actions",
      headerName: "",
      width: 64,
      align: "right",
      sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title="Delete report">
          <IconButton
            aria-label={`Delete report ${row.receiptId}`}
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // don't open the report
              setReportToDelete(row);
            }}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Reports"
        subtitle={admin ? `Welcome back, ${admin.email}` : undefined}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                void reportList.refetch();
                void stats.refetch();
              }}
              loading={reportList.isFetching}
            >
              Refresh
            </Button>
            <Button href="/admin/analytics" variant="contained" startIcon={<BarChartRoundedIcon />}>
              Analytics
            </Button>
          </>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, lg: 3 }}>
          <StatTile
            label="Total reports"
            value={stats.data?.total ?? "–"}
            icon={<InboxRoundedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }}>
          <StatTile
            label="Open"
            value={stats.data?.open ?? "–"}
            hint="Pending, reviewed or escalated"
            icon={<AssignmentLateRoundedIcon />}
            tone="secondary"
          />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }}>
          <StatTile
            label="Awaiting review"
            value={stats.data?.byStatus.pending ?? "–"}
            icon={<HourglassTopRoundedIcon />}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }}>
          <StatTile
            label="Last 30 days"
            value={stats.data?.last30Days ?? "–"}
            icon={<CalendarMonthRoundedIcon />}
            tone="info"
          />
        </Grid>
      </Grid>

      <Card sx={{ overflow: "hidden" }}>
        <Tabs
          value={STATUS_TABS.some((t) => t.value === filters.status) ? filters.status : ""}
          onChange={(_, value: string) => updateParams({ status: value })}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}
        >
          {STATUS_TABS.map((t) => {
            const count = tabCount(t.value);
            return (
              <Tab
                key={t.value || "all"}
                value={t.value}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {t.label}
                    {count !== null && (
                      <Box
                        component="span"
                        sx={{
                          px: 0.75,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          bgcolor: "action.hover",
                        }}
                      >
                        {count}
                      </Box>
                    )}
                  </Box>
                }
                sx={{ minHeight: 52, fontWeight: 650 }}
              />
            );
          })}
        </Tabs>

        <Box sx={{ display: "flex", gap: 1.5, p: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Search receipt ID, bus, route, location"
            aria-label="Search reports"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ flex: "1 1 260px", maxWidth: 420 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Category"
            value={filters.category}
            onChange={(e) => updateParams({ category: e.target.value })}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All categories</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            size="small"
            label="From"
            value={filters.from}
            onChange={(e) => updateParams({ from: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={filters.to}
            onChange={(e) => updateParams({ to: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {hasFilters && (
            <Button startIcon={<FilterAltOffRoundedIcon />} onClick={clearFilters}>
              Clear
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {errorMessage(error, "Failed to fetch reports")}
          </Alert>
        )}

        <DataGrid
          rows={data.reports}
          columns={columns}
          getRowHeight={() => "auto"}
          loading={reportList.isPending || reportList.isPlaceholderData}
          paginationMode="server"
          rowCount={data.total}
          paginationModel={{ page: page - 1, pageSize: limit }}
          onPaginationModelChange={(model) =>
            updateParams({
              page: model.page + 1,
              limit: model.pageSize === 20 ? null : model.pageSize,
            })
          }
          pageSizeOptions={[10, 20, 50, 100]}
          onRowClick={({ row }) => router.push(`/admin/reports/${row.id}`)}
          disableColumnFilter
          disableColumnSorting
          disableColumnMenu
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <EmptyState
                icon={hasFilters ? <SearchOffRoundedIcon /> : <InboxRoundedIcon />}
                title={hasFilters ? "No reports match these filters" : "No reports yet"}
                description={
                  hasFilters
                    ? "Try a different search or clear the filters."
                    : "New passenger reports will appear here."
                }
              />
            ),
          }}
          sx={{
            border: 0,
            borderRadius: 0,
            minHeight: 420,
            "--DataGrid-containerBackground": "var(--mui-palette-background-default)",
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              color: "text.secondary",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            },
            "& .MuiDataGrid-row": { cursor: "pointer" },
            "& .MuiDataGrid-cell": { display: "flex", alignItems: "center", py: 1 },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
          }}
        />
      </Card>

      <Dialog
        open={reportToDelete !== null}
        onClose={() => setReportToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this report?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The report for bus <strong>{reportToDelete?.busNumber}</strong> (
            {reportToDelete?.receiptId}) and its history will be removed permanently. This cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReportToDelete(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AdminDashboardView;
