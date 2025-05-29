// src/pages/ReportDetailsPage.js
import React, { useEffect, useState, useContext, useCallback } from "react"; // <--- ADD useCallback here
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip, // <--- ADD Chip here
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { getReportById, updateReportStatus } from "../api/reports";
import { AuthContext } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

const DetailContainer = styled(Paper)`
  padding: ${({ theme }) => theme.spacing * 4}px;
  margin-top: ${({ theme }) => theme.spacing * 4}px;
  margin-bottom: ${({ theme }) => theme.spacing * 4}px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing * 3}px;
`;

const SectionTitle = styled(Typography)`
  margin-top: ${({ theme }) => theme.spacing * 3}px;
  margin-bottom: ${({ theme }) => theme.spacing * 2}px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const MediaGrid = styled(Grid)`
  margin-top: ${({ theme }) => theme.spacing * 2}px;
`;

const MediaItem = styled(Box)`
  width: 150px;
  height: 150px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing * 2}px;

  img,
  video {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");

  const fetchReportDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReportById(id, token);
      setReport(data);
      setCurrentStatus(data.status); // Set initial status
    } catch (err) {
      console.error("Failed to fetch report details:", err);
      setError(err.message || "Failed to fetch report details");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchReportDetails();
  }, [fetchReportDetails]);

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;
    setCurrentStatus(newStatus);
    try {
      setLoading(true); // Indicate loading while updating status
      const updatedReport = await updateReportStatus(
        report._id,
        newStatus,
        token
      );
      setReport(updatedReport); // Update the report state with the new status
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false); // End loading
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
          Loading report details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchReportDetails} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Report not found.</Alert>
      </Container>
    );
  }

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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <DetailContainer elevation={3}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h4" component="h1" color="primary">
            Report Details (ID: {report.receiptId})
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>

        <SectionTitle variant="h5">Report Information</SectionTitle>
        <Typography variant="body1">
          <strong>Bus Number:</strong> {report.busNumber}
        </Typography>
        <Typography variant="body1">
          <strong>Route Number:</strong> {report.routeNumber}
        </Typography>
        {report.busName && (
          <Typography variant="body1">
            <strong>Bus Name:</strong> {report.busName}
          </Typography>
        )}
        <Typography variant="body1">
          <strong>Location:</strong> {report.location}
        </Typography>
        <Typography variant="body1">
          <strong>Reported At:</strong>{" "}
          {new Date(report.reportedAt).toLocaleString()}
        </Typography>
        <Typography variant="body1">
          <strong>Status:</strong>{" "}
          <Chip
            label={report.status}
            color={getStatusColor(report.status)}
            size="small"
          />
        </Typography>
        {report.passengerEmail && (
          <Typography variant="body1">
            <strong>Passenger Email:</strong> {report.passengerEmail}
          </Typography>
        )}

        <SectionTitle variant="h5">Actions</SectionTitle>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="status-select-label">Update Status</InputLabel>
          <Select
            labelId="status-select-label"
            id="status-select"
            value={currentStatus}
            label="Update Status"
            onChange={handleStatusChange}
            disabled={loading}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="reviewed">Reviewed</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
        {loading && (
          <CircularProgress
            size={24}
            sx={{ display: "block", mx: "auto", my: 2 }}
          />
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {report.images && report.images.length > 0 && (
          <>
            <SectionTitle variant="h5">Attached Images</SectionTitle>
            <MediaGrid container spacing={2}>
              {report.images.map((imgUrl, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <MediaItem elevation={2}>
                    <img
                      src={imgUrl}
                      alt={`Attachment ${index + 1} for report ID ${
                        report.receiptId
                      }`}
                    />
                  </MediaItem>
                </Grid>
              ))}
            </MediaGrid>
          </>
        )}

        {report.videos && report.videos.length > 0 && (
          <>
            <SectionTitle variant="h5" sx={{ mt: 4 }}>
              Attached Videos
            </SectionTitle>
            <MediaGrid container spacing={2}>
              {report.videos.map((videoUrl, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <MediaItem elevation={2}>
                    <video
                      controls
                      src={videoUrl}
                      style={{ width: "100%", height: "auto" }}
                    />
                  </MediaItem>
                </Grid>
              ))}
            </MediaGrid>
          </>
        )}
      </DetailContainer>
    </Container>
  );
}

export default ReportDetailsPage;
