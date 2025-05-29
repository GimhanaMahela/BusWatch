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
// --- CHANGE THIS LINE ---
// import { styled } from "styled-components"; // <--- This is the problem!
import { styled } from "@mui/material/styles"; // <--- Use this instead!
// -----------------------
import { getAllReports, deleteReport } from "../api/reports";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  // FIX: theme.spacing is a number now, multiply it. Add px.
  margin-bottom: ${({ theme }) => theme.spacing * 4}px;
  flex-wrap: wrap;
  // FIX: theme.spacing is a number now, multiply it. Add px.
  gap: ${({ theme }) => theme.spacing * 2}px;
`;

const ReportTableContainer = styled(TableContainer)`
  // FIX: theme.spacing is a number now, multiply it. Add px.
  margin-top: ${({ theme }) => theme.spacing * 4}px;
`;

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
        justifyContent="center"
        alignItems="center"
        height="70vh"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading reports...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchReports} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <DashboardHeader>
        <Typography variant="h4" component="h1" color="primary">
          Admin Dashboard - All Reports
        </Typography>
        <Button variant="outlined" color="secondary" onClick={logout}>
          Logout
        </Button>
      </DashboardHeader>

      {reports.length === 0 ? (
        <Alert severity="info">No reports found.</Alert>
      ) : (
        <ReportTableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt ID</TableCell>
                <TableCell>Bus Number</TableCell>
                <TableCell>Route Number</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Reported At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell>{report.receiptId}</TableCell>
                  <TableCell>{report.busNumber}</TableCell>
                  <TableCell>{report.routeNumber}</TableCell>
                  <TableCell>{report.location}</TableCell>
                  <TableCell>
                    {new Date(report.reportedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status}
                      color={getStatusColor(report.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="view"
                      color="primary"
                      onClick={() => navigate(`/admin/reports/${report._id}`)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      color="error"
                      onClick={() => handleDeleteClick(report)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ReportTableContainer>
      )}

      <Dialog
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
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminDashboardPage;
