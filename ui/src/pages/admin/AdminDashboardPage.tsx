import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import BarChartIcon from "@mui/icons-material/BarChart";
import GroupIcon from "@mui/icons-material/Group";
import { styled } from "@mui/material/styles";
import { errorMessage } from "../../api/apiClient";
import { useDeleteReport, useReportList } from "../../hooks/useReportQueries";
import type { Report, ReportListParams } from "../../types/report";
import useAuth from "../../hooks/useAuth";
import { GradientButton, StatusChip } from "../../components/atoms";
import { useNavigate, useSearchParams } from "react-router";
import { ManageAdminsDialog } from "../../components/organisms";
import { CATEGORIES, STATUSES, categoryLabel } from "../../constants/reportConstants";

const DashboardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(4),
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const FilterSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  flexWrap: "wrap",
}));

const ReportTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  boxShadow: theme.shadows[6],
  overflowX: "auto",
})) as typeof TableContainer;

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: theme.palette.primary.main,
  "& .MuiTableCell-head": {
    color: theme.palette.common.white,
    fontWeight: 700,
    fontSize: "1rem",
    padding: theme.spacing(2),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
  transition: "background-color 0.2s ease-in-out",
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  fontSize: "0.9rem",
}));

const StyledActionButton = styled(IconButton)(() => ({
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.1)",
  },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: Number(theme.shape.borderRadius) * 2,
    boxShadow: theme.shadows[10],
  },
  "& .MuiDialogTitle-root": {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white,
    fontWeight: 700,
    padding: theme.spacing(2, 3),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
  },
}));

// Filters live in the URL so a filtered view survives "back" from a report and can be shared
const FILTER_KEYS = ["q", "status", "category", "from", "to"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function AdminDashboardPage() {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, searchParams.get(k) ?? ""]),
  ) as Record<FilterKey, string>;
  const page = Math.max(parseInt(searchParams.get("page") ?? "", 10) || 1, 1);
  const limit = parseInt(searchParams.get("limit") ?? "", 10) || 20;

  const [searchInput, setSearchInput] = useState(filters.q);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [adminsOpen, setAdminsOpen] = useState(false);

  const listParams: ReportListParams = {
    page: 1,
    limit: 20,
    ...Object.fromEntries(searchParams),
  };
  const reportList = useReportList(listParams);
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
    setSearchParams(next);
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
    setSearchParams(new URLSearchParams());
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  const confirmDelete = () => {
    if (!reportToDelete) return;
    deleteMutation.mutate(reportToDelete.id, { onSettled: closeDeleteDialog });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <DashboardHeader>
        <Box>
          <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 700 }}>
            Admin Dashboard - Reports
          </Typography>
          {admin && (
            <Typography variant="body2" color="text.secondary">
              Signed in as {admin.email} ({admin.role})
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={() => navigate("/admin/analytics")}
          >
            Analytics
          </Button>
          {admin?.role === "superadmin" && (
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => setAdminsOpen(true)}
            >
              Admins
            </Button>
          )}
          <GradientButton size="small" onClick={logout}>
            Logout
          </GradientButton>
        </Box>
      </DashboardHeader>

      <FilterSection>
        <TextField
          label="Search receipt ID, bus, route, location"
          variant="outlined"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 240, maxWidth: 420 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(e) => updateParams({ status: e.target.value })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="open">Open (not closed)</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
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
          <Button variant="text" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </FilterSection>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {errorMessage(error, "Failed to fetch reports")}
        </Alert>
      )}

      <ReportTableContainer component={Paper}>
        <Table sx={{ minWidth: 900 }}>
          <StyledTableHead>
            <TableRow>
              <TableCell>Receipt ID</TableCell>
              <TableCell>Bus Number</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Reported At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {reportList.isPending ? (
              <TableRow>
                <StyledTableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
                  <CircularProgress size={36} />
                </StyledTableCell>
              </TableRow>
            ) : data.reports.length === 0 ? (
              <TableRow>
                <StyledTableCell colSpan={8} sx={{ textAlign: "center" }}>
                  {hasFilters ? "No reports match these filters." : "No reports found."}
                </StyledTableCell>
              </TableRow>
            ) : (
              data.reports.map((report) => (
                <StyledTableRow key={report.id}>
                  <StyledTableCell sx={{ fontFamily: "monospace" }}>
                    {report.receiptId}
                  </StyledTableCell>
                  <StyledTableCell>{report.busNumber}</StyledTableCell>
                  <StyledTableCell>{report.routeNumber}</StyledTableCell>
                  <StyledTableCell>{categoryLabel(report.category)}</StyledTableCell>
                  <StyledTableCell>{report.location}</StyledTableCell>
                  <StyledTableCell>{new Date(report.reportedAt).toLocaleString()}</StyledTableCell>
                  <StyledTableCell>
                    <StatusChip status={report.status} uppercase sx={{ borderRadius: 1 }} />
                  </StyledTableCell>
                  <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <StyledActionButton
                      aria-label="view"
                      color="primary"
                      onClick={() => navigate(`/admin/reports/${report.id}`)}
                    >
                      <VisibilityIcon />
                    </StyledActionButton>
                    <StyledActionButton
                      aria-label="delete"
                      color="error"
                      onClick={() => handleDeleteClick(report)}
                    >
                      <DeleteIcon />
                    </StyledActionButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data.total}
          page={Math.min(page - 1, Math.max(Math.ceil(data.total / limit) - 1, 0))}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={(_, newPage) => updateParams({ page: newPage + 1 })}
          onRowsPerPageChange={(e) => updateParams({ limit: e.target.value })}
        />
      </ReportTableContainer>

      <StyledDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ mt: 2 }}>
            Are you sure you want to delete the report for Bus Number "{reportToDelete?.busNumber}"
            (ID: {reportToDelete?.receiptId})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            autoFocus
            variant="contained"
            color="error"
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </StyledDialog>

      <ManageAdminsDialog open={adminsOpen} onClose={() => setAdminsOpen(false)} />
    </Container>
  );
}

export default AdminDashboardPage;
