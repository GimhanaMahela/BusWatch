import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
// --- CHANGE THIS LINE ---
// import { styled } from "styled-components"; // <--- This is the problem!
import { styled } from "@mui/material/styles"; // <--- Use this instead!
// -----------------------
import { submitReport } from "../api/reports";

const FormContainer = styled(Paper)`
  // FIX: theme.spacing is a number now, multiply it. Add px for CSS.
  padding: ${({ theme }) => theme.spacing * 4}px;
  margin-top: ${({ theme }) => theme.spacing * 4}px;
  margin-bottom: ${({ theme }) => theme.spacing * 4}px;
  display: flex;
  flex-direction: column;
  // FIX: theme.spacing is a number now, multiply it. Add px for CSS.
  gap: ${({ theme }) => theme.spacing * 3}px;
`;

const FileInputLabel = styled(Typography)`
  // FIX: theme.spacing is a number now, multiply it. Add px for CSS.
  margin-top: ${({ theme }) => theme.spacing * 2}px;
  margin-bottom: ${({ theme }) => theme.spacing * 1}px;
  font-weight: bold;
`;

const PreviewContainer = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  // FIX: theme.spacing is a number now, multiply it. Add px for CSS.
  gap: ${({ theme }) => theme.spacing * 2}px;
  margin-top: ${({ theme }) => theme.spacing * 2}px;
`;

const MediaPreview = styled(Box)`
  width: 150px;
  height: 150px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  img,
  video {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

function SubmitReportPage() {
  const [formData, setFormData] = useState({
    busNumber: "",
    routeNumber: "",
    busName: "",
    location: "",
    description: "",
    passengerEmail: "",
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [receiptId, setReceiptId] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImages([...images, ...Array.from(e.target.files)]);
  };

  const handleVideoChange = (e) => {
    setVideos([...videos, ...Array.from(e.target.files)]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ open: false, message: "", severity: "success" }); // Clear previous alerts

    try {
      const response = await submitReport(formData, images, videos);
      setReceiptId(response.receiptId);
      setAlert({
        open: true,
        message: `Report submitted successfully! Your Receipt ID is: ${response.receiptId}`,
        severity: "success",
      });
      // Clear form after successful submission
      setFormData({
        busNumber: "",
        routeNumber: "",
        busName: "",
        location: "",
        description: "",
        passengerEmail: "",
      });
      setImages([]);
      setVideos([]);
    } catch (error) {
      console.error("Submission error:", error);
      setAlert({
        open: true,
        message: error.message || "Failed to submit report. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setAlert({ ...alert, open: false });
  };

  return (
    <Container maxWidth="md">
      <FormContainer elevation={3}>
        <Typography variant="h4" component="h1" align="center" color="primary">
          Submit a New Report
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary">
          Please fill out the form below to report an issue with public
          transport.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Bus Number (e.g., NA-1234)"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            label="Route Number (e.g., 138, Kandy-Colombo)"
            name="routeNumber"
            value={formData.routeNumber}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            label="Bus Name (Optional)"
            name="busName"
            value={formData.busName}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            label="Location of Incident (e.g., Main Street, Colombo)"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            label="Description of Incident"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            label="Your Email (for receipt - optional)"
            name="passengerEmail"
            type="email"
            value={formData.passengerEmail}
            onChange={handleChange}
          />

          <FileInputLabel variant="subtitle1">
            Upload Images (Max 5)
          </FileInputLabel>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={images.length >= 5}
          />
          <PreviewContainer>
            {images.map((file, index) => (
              <MediaPreview key={index}>
                <img src={URL.createObjectURL(file)} alt={`preview-${index}`} />
              </MediaPreview>
            ))}
          </PreviewContainer>

          <FileInputLabel variant="subtitle1">
            Upload Videos (Max 2)
          </FileInputLabel>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoChange}
            disabled={videos.length >= 2}
          />
          <PreviewContainer>
            {videos.map((file, index) => (
              <MediaPreview key={index}>
                <video controls src={URL.createObjectURL(file)} />
              </MediaPreview>
            ))}
          </PreviewContainer>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit Report"
            )}
          </Button>
        </form>
      </FormContainer>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
          {receiptId && alert.severity === "success" && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please check your email for the detailed receipt.
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SubmitReportPage;
