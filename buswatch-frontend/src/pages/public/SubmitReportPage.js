import React, { useState } from "react"; // Removed useCallback
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
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Icons for text fields
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import CommuteIcon from "@mui/icons-material/Commute";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"; // Added for error alert

// Styled component for the main form container (Paper)
const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.shape.borderRadius * 2, // More rounded corners
  boxShadow: theme.shadows[8], // Deeper shadow for elevation
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`, // Subtle gradient background
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(6), // Larger padding on medium and up screens
  },
}));

// Styled component for TextField to apply consistent styling
const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(3), // Space below each text field
  paddingBottom: theme.spacing(1), // Additional padding at the bottom
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius, // Rounded input borders
    transition: "all 0.3s ease-in-out", // Smooth transition for hover/focus effects
    "& fieldset": {
      borderColor: theme.palette.grey[300], // Default border color
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main, // Primary color on hover
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.dark, // Darker primary color on focus
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}40`, // Subtle glow on focus
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary, // Label color
    "&.Mui-focused": {
      color: theme.palette.primary.dark, // Darker primary color for focused label
    },
  },
}));

// Styled component for file input labels
const FileInputLabel = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  fontWeight: 600, // Bold font
  color: theme.palette.text.primary, // Primary text color
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1), // Space between icon and text
}));

// Styled component for media preview container
const PreviewContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap", // Allow items to wrap to the next line
  gap: theme.spacing(2), // Space between preview items
  marginTop: theme.spacing(2),
  justifyContent: "center", // Center the preview items
}));

// Styled component for individual media previews (image/video)
const MediaPreview = styled(Box)(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: theme.shape.borderRadius,
  border: `2px solid ${theme.palette.grey[200]}`, // Light gray border
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden", // Hide overflowing content
  position: "relative",
  boxShadow: theme.shadows[2], // Subtle shadow
  transition: "transform 0.2s ease-in-out", // Smooth scale on hover
  "&:hover": {
    transform: "scale(1.05)", // Slightly enlarge on hover
  },

  "& img, & video": {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "cover", // Cover the area without distortion
  },
}));

// Styled component for the submit button
const StyledButton = styled(Button)(({ theme }) => ({
  fontSize: "1.1rem",
  padding: theme.spacing(1.5, 4),
  borderRadius: 50, // Pill-shaped button
  fontWeight: 700,
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`, // Gradient background
  boxShadow: `0 3px 5px 2px rgba(${theme.palette.primary.main},.3)`, // Shadow for depth
  transition: "all 0.3s ease-in-out", // Smooth transitions
  "&:hover": {
    transform: "translateY(-2px)", // Lift effect on hover
    boxShadow: `0 6px 10px 3px rgba(${theme.palette.primary.main},.4)`, // Enhanced shadow on hover
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`, // Darker gradient on hover
  },
  "&.Mui-disabled": {
    background: theme.palette.grey[300], // Disabled state background
    color: theme.palette.grey[500], // Disabled state text color
    boxShadow: "none", // No shadow when disabled
  },
}));

function SubmitReportPage() {
  // State to manage form input data
  const [formData, setFormData] = useState({
    busNumber: "",
    routeNumber: "",
    busName: "",
    location: "",
    description: "",
    passengerEmail: "",
  });
  // State to store selected image files
  const [images, setImages] = useState([]);
  // State to store selected video files
  const [videos, setVideos] = useState([]);
  // State to indicate loading status during form submission
  const [loading, setLoading] = useState(false);
  // State to manage the alert/snackbar messages
  const [alert, setAlert] = useState({
    open: false, // Whether the alert is visible
    message: "", // The message to display
    severity: "success", // 'success' or 'error' for styling
  });
  // State to store the receipt ID received from the backend
  const [receiptId, setReceiptId] = useState(null);
  // State to store the PDF URL received from the backend
  const [pdfUrl, setPdfUrl] = useState(null);

  // Handler for text input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler for image file input changes
  const handleImageChange = (e) => {
    // Limit to a maximum of 5 images
    const newImages = Array.from(e.target.files).slice(0, 5 - images.length);
    setImages([...images, ...newImages]);
  };

  // Handler for video file input changes
  const handleVideoChange = (e) => {
    // Limit to a maximum of 2 videos
    const newVideos = Array.from(e.target.files).slice(0, 2 - videos.length);
    setVideos([...videos, ...newVideos]);
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading to true
    setAlert({ open: false, message: "", severity: "success" }); // Hide any previous alerts
    setPdfUrl(null); // Clear previous PDF URL

    try {
      const formDataToSend = new FormData(); // Create FormData object for file uploads
      // Append text fields to FormData
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }
      // Append image files to FormData
      images.forEach((file) => {
        formDataToSend.append("images", file); // 'images' should match req.files.images in backend
      });
      // Append video files to FormData
      videos.forEach((file) => {
        formDataToSend.append("videos", file); // 'videos' should match req.files.videos in backend
      });

      // Send the report data to the backend API
      const response = await fetch("/api/reports", {
        method: "POST",
        body: formDataToSend, // FormData automatically sets Content-Type to multipart/form-data
      });

      const data = await response.json(); // Parse the JSON response

      if (!response.ok) {
        // If response is not OK (e.g., 4xx, 5xx status codes)
        throw new Error(data.message || "Failed to submit report");
      }

      setReceiptId(data.receiptId); // Store the receipt ID
      setPdfUrl(data.pdfUrl); // Store the PDF URL from the backend response
      setAlert({
        open: true,
        message: `Report submitted successfully! Your Receipt ID is: ${data.receiptId}`,
        severity: "success",
      });

      // Clear form fields and media arrays after successful submission
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
      setLoading(false); // Reset loading state
    }
  };

  // Handler to close the Snackbar alert
  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") {
      return; // Do not close if clicked outside
    }
    setAlert({ ...alert, open: false }); // Close the alert
  };

  // Handler to download the PDF receipt
  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.setAttribute("download", `BusWatch_Receipt_${receiptId}.pdf`); // Suggests a filename for download
      document.body.appendChild(link);
      link.click(); // Programmatically click the link to start download
      document.body.removeChild(link); // Clean up the temporary link
      setAlert({ ...alert, open: false }); // Close the alert prompt after download click
    } else {
      console.warn("No PDF URL available to download.");
    }
  };

  return (
    <Container maxWidth="md">
      <FormContainer elevation={3}>
        <Typography
          variant="h4"
          component="h1"
          align="center"
          color="primary"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          Submit a New Report
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="textSecondary"
          sx={{ mb: 3 }}
        >
          Your feedback helps us improve public transport for everyone.
        </Typography>

        <form onSubmit={handleSubmit}>
          <StyledTextField
            fullWidth
            label="Bus Number (e.g., NE-9999)"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DriveEtaIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <StyledTextField
            fullWidth
            label="Route Number (e.g., 08, Colombo-Matale)"
            name="routeNumber"
            value={formData.routeNumber}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AltRouteIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <StyledTextField
            fullWidth
            label="Bus Name (Nuwantha Express)"
            name="busName"
            value={formData.busName}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CommuteIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <StyledTextField
            fullWidth
            label="Location of Incident (e.g., Ambepussa Junction)"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <StyledTextField
            fullWidth
            label="Description of Incident"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DescriptionIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <StyledTextField
            fullWidth
            label="Your Email (for receipt)"
            name="passengerEmail"
            type="email"
            value={formData.passengerEmail}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FileInputLabel variant="subtitle1">
            <ImageOutlinedIcon /> Upload Images (Max 5)
          </FileInputLabel>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={images.length >= 5}
            style={{ marginBottom: "16px" }}
          />
          <PreviewContainer>
            {images.map((file, index) => (
              <MediaPreview key={index}>
                <img src={URL.createObjectURL(file)} alt={`preview-${index}`} />
              </MediaPreview>
            ))}
          </PreviewContainer>

          <FileInputLabel variant="subtitle1">
            <VideocamOutlinedIcon /> Upload Videos (Max 2)
          </FileInputLabel>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoChange}
            disabled={videos.length >= 2}
            style={{ marginBottom: "16px" }}
          />
          <PreviewContainer>
            {videos.map((file, index) => (
              <MediaPreview key={index}>
                <video controls src={URL.createObjectURL(file)} />
              </MediaPreview>
            ))}
          </PreviewContainer>

          <StyledButton
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit Report"
            )}
          </StyledButton>
        </form>
      </FormContainer>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Positions the Snackbar at the top-center
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled" // Provides a solid background for better visibility
          icon={
            alert.severity === "success" ? (
              <CheckCircleOutlineIcon fontSize="inherit" />
            ) : (
              <ErrorOutlineIcon fontSize="inherit" />
            )
          } // Displays a dynamic icon based on severity
          sx={{
            width: "100%",
            minWidth: { xs: "90%", sm: "400px" }, // Ensures responsiveness
            boxShadow: (theme) => theme.shadows[6], // Adds a subtle shadow for depth
            borderRadius: (theme) => theme.shape.borderRadius, // Rounds the corners
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5, // Vertical padding
            px: 2, // Horizontal padding
            // Custom light green color for success alerts
            backgroundColor:
              alert.severity === "success" ? "#d0f0c0" : undefined,
            color: alert.severity === "success" ? "#155724" : undefined, // Darker text for contrast
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {alert.message.split("Your Receipt ID is:")[0]}{" "}
              {/* Displays the main message */}
            </Typography>
            {receiptId && alert.severity === "success" && (
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                Your Receipt ID is: {receiptId}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Please check your email for the detailed receipt.
            </Typography>
            {pdfUrl && (
              <Button
                variant="text"
                color="inherit"
                size="small"
                onClick={handleDownloadPdf}
                sx={{
                  mt: 1,
                  textDecoration: "underline",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Download Receipt PDF
              </Button>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SubmitReportPage;
