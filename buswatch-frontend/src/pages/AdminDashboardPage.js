// src/pages/AdminDashboardPage.js
import React, { useEffect, useState, useContext, useCallback } from "react";
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
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { styled } from "@mui/material/styles"; // Correct import for MUI's styled utility
import { getAllReports, deleteReport } from "../api/reports"; // Assuming this path is correct
import { AuthContext } from "../context/AuthContext"; // Assuming this path is correct
import { useNavigate } from "react-router-dom";

const DashboardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(4),
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const ReportTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[6],
  overflow: "hidden", // Ensures rounded corners apply correctly to content
  overflowX: "auto", // Added to enable horizontal scrolling on smaller screens
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: theme.palette.primary.main, // Primary color background for header
  "& .MuiTableCell-head": {
    color: theme.palette.common.white,
    fontWeight: 700,
    fontSize: "1rem",
    padding: theme.spacing(2),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover, // Zebra striping for readability
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected, // Highlight row on hover
  },
  transition: "background-color 0.2s ease-in-out",
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5, 2), // Consistent padding for cells
  fontSize: "0.9rem",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  fontSize: "0.9rem", // Slightly smaller for dashboard actions
  padding: theme.spacing(1, 2.5), // Adjusted padding
  borderRadius: 50, // Pill shape
  fontWeight: 700,
  // Changed background to use primary palette colors for consistency
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
  boxShadow: `0 3px 5px 2px rgba(${theme.palette.primary.main},.3)`,
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: `0 6px 10px 3px rgba(${theme.palette.primary.main},.4)`,
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
  },
  "&.Mui-disabled": {
    background: theme.palette.grey[300],
    color: theme.palette.grey[500],
    boxShadow: "none",
  },
}));

const StyledActionButton = styled(IconButton)(({ theme }) => ({
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.1)",
  },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[10],
    background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
  },
  "& .MuiDialogTitle-root": {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white,
    fontWeight: 700,
    padding: theme.spacing(2, 3),
  },
  "& .MuiDialogContentText-root": {
    color: theme.palette.text.secondary,
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
  },
}));

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "reviewed":
      return "info";
    case "resolved":
      return "success";
    default:
      return "default";
  }
};

function AdminDashboardPage() {
  const { token, logout } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const navigate = useNavigate();

  // Wrap fetchReports with useCallback
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllReports(token);
      setReports(data);
      setError(null); // Clear any previous errors on successful fetch
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError(err.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token, fetchReports]);

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (reportToDelete) {
      try {
        setLoading(true);
        await deleteReport(reportToDelete._id, token);
        setReports(reports.filter((r) => r._id !== reportToDelete._id));
        setDeleteDialogOpen(false);
        setReportToDelete(null);
        setError(null);
      } catch (err) {
        console.error("Failed to delete report:", err);
        setError(err.message || "Failed to delete report");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="70vh"
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="primary">
          Loading reports...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
        <StyledButton
          variant="contained"
          onClick={fetchReports}
          sx={{
            background: `linear-gradient(45deg, ${(theme) =>
              theme.palette.primary.main} 30%, ${(theme) =>
              theme.palette.primary.light} 90%)`,
            boxShadow: `0 3px 5px 2px rgba(${(theme) =>
              theme.palette.primary.main},.3)`,
            "&:hover": {
              background: `linear-gradient(45deg, ${(theme) =>
                theme.palette.primary.dark} 30%, ${(theme) =>
                theme.palette.primary.main} 90%)`,
            },
          }}
        >
          Retry
        </StyledButton>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <DashboardHeader>
        <Typography
          variant="h4"
          component="h1"
          color="primary"
          sx={{ fontWeight: 700 }}
        >
          Admin Dashboard - All Reports
        </Typography>
        <StyledButton variant="contained" onClick={logout}>
          Logout
        </StyledButton>
      </DashboardHeader>

      {reports.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No reports found.
        </Alert>
      ) : (
        <ReportTableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <StyledTableHead>
              <TableRow>
                <TableCell>Receipt ID</TableCell>
                <TableCell>Bus Number</TableCell>
                <TableCell>Route Number</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Reported At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {reports.map((report) => (
                <StyledTableRow key={report._id}>
                  <StyledTableCell>{report.receiptId}</StyledTableCell>
                  <StyledTableCell>{report.busNumber}</StyledTableCell>
                  <StyledTableCell>{report.routeNumber}</StyledTableCell>
                  <StyledTableCell>{report.location}</StyledTableCell>
                  <StyledTableCell>
                    {new Date(report.reportedAt).toLocaleString()}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={report.status.toUpperCase()}
                      color={getStatusColor(report.status)}
                      size="medium"
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <StyledActionButton
                      aria-label="view"
                      color="primary"
                      onClick={() => navigate(`/admin/reports/${report._id}`)}
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
              ))}
            </TableBody>
          </Table>
        </ReportTableContainer>
      )}

      <StyledDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the report for Bus Number "
            {reportToDelete?.busNumber}" (ID: {reportToDelete?.receiptId})? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <StyledButton
            onClick={confirmDelete}
            // Removed color="error" prop here as custom background will override it
            autoFocus
            // Apply error palette colors for background and boxShadow
            sx={{
              background: (theme) =>
                `linear-gradient(45deg, ${theme.palette.error.main} 30%, ${theme.palette.error.light} 90%)`,
              boxShadow: (theme) =>
                `0 3px 5px 2px rgba(${theme.palette.error.main},.3)`,
              "&:hover": (theme) => ({
                background: `linear-gradient(45deg, ${theme.palette.error.dark} 30%, ${theme.palette.error.main} 90%)`,
                boxShadow: `0 6px 10px 3px rgba(${theme.palette.error.main},.4)`,
              }),
              color: "white", // Ensure text color is white on dark background
            }}
          >
            Delete
          </StyledButton>
        </DialogActions>
      </StyledDialog>
    </Container>
  );
}

export default AdminDashboardPage;
