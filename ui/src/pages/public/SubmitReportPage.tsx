import { useState, type ChangeEvent, type FormEvent, type SyntheticEvent } from "react";
import { Link as RouterLink } from "react-router";
import {
  MenuItem,
  IconButton,
  Box,
  Typography,
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CategoryIcon from "@mui/icons-material/Category";
import EventIcon from "@mui/icons-material/Event";
import { FormTextField, GradientButton } from "../../components/atoms";
import { LocationPicker } from "../../components/molecules";
import type { LatLng } from "../../components/molecules/LocationPicker";
import { toApiError } from "../../api/apiClient";
import type { ReportCategory } from "../../constants/reportConstants";
import { submitReport } from "../../api/reportApi";
import { CATEGORIES } from "../../constants/reportConstants";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // Must match the backend upload limit

interface ReportForm {
  busNumber: string;
  routeNumber: string;
  busName: string;
  category: ReportCategory | "";
  incidentAt: string;
  location: string;
  description: string;
  passengerEmail: string;
  website: string;
}

const EMPTY_FORM: ReportForm = {
  busNumber: "",
  routeNumber: "",
  busName: "",
  category: "",
  incidentAt: "",
  location: "",
  description: "",
  passengerEmail: "",
  website: "", // Honeypot: hidden from people, bots tend to fill it in
};

// Value for <input type="datetime-local" max=...> in the user's local time
const nowForDateTimeInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// Styled component for the main form container (Paper)
const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  borderRadius: Number(theme.shape.borderRadius) * 2, // More rounded corners
  boxShadow: theme.shadows[8], // Deeper shadow for elevation
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`, // Subtle gradient background
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(6), // Larger padding on medium and up screens
  },
}));

// Public form fields get a little extra space below the helper text
const StyledTextField = styled(FormTextField)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
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

function SubmitReportPage() {
  // State to manage form input data
  const [formData, setFormData] = useState(EMPTY_FORM);
  // GPS point for the incident: { lat, lng } or null
  const [coords, setCoords] = useState<LatLng | null>(null);
  // State to store selected image files
  const [images, setImages] = useState<File[]>([]);
  // State to store selected video files
  const [videos, setVideos] = useState<File[]>([]);
  // State to indicate loading status during form submission
  const [loading, setLoading] = useState(false);
  // State to manage the alert/snackbar messages
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false, // Whether the alert is visible
    message: "", // The message to display
    severity: "success", // 'success' or 'error' for styling
  });
  // State to store the receipt ID received from the backend
  const [receiptId, setReceiptId] = useState<string | null>(null);
  // State to store the PDF URL received from the backend
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const showError = (message: string) => setAlert({ open: true, message, severity: "error" });

  // Drop files over the size limit and tell the user which ones
  const withinSizeLimit = (files: File[]) => {
    const tooBig = files.filter((f) => f.size > MAX_FILE_BYTES);
    if (tooBig.length > 0) {
      showError(
        `${tooBig.map((f) => f.name).join(", ")} ${
          tooBig.length === 1 ? "is" : "are"
        } larger than 10MB and ${tooBig.length === 1 ? "was" : "were"} not added.`,
      );
    }
    return files.filter((f) => f.size <= MAX_FILE_BYTES);
  };

  // Handler for text input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler for image file input changes
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Limit to a maximum of 5 images
    const newImages = withinSizeLimit(Array.from(e.target.files ?? [])).slice(0, 5 - images.length);
    setImages([...images, ...newImages]);
    e.target.value = ""; // Allow picking the same file again after removing it
  };

  // Handler for video file input changes
  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Limit to a maximum of 2 videos
    const newVideos = withinSizeLimit(Array.from(e.target.files ?? [])).slice(0, 2 - videos.length);
    setVideos([...videos, ...newVideos]);
    e.target.value = "";
  };

  // Handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading to true
    setAlert({ open: false, message: "", severity: "success" }); // Hide any previous alerts
    setPdfUrl(null); // Clear previous PDF URL
    setReceiptId(null);

    try {
      const data = await submitReport(
        {
          ...formData,
          // datetime-local has no timezone; send an unambiguous ISO timestamp
          incidentAt: formData.incidentAt ? new Date(formData.incidentAt).toISOString() : "",
          latitude: coords ? coords.lat : "",
          longitude: coords ? coords.lng : "",
        },
        images,
        videos,
      );

      setReceiptId(data.receiptId);
      setPdfUrl(data.pdfUrl);
      setEmailSent(Boolean(data.emailSent));

      // Clear form fields and media arrays after successful submission
      setFormData(EMPTY_FORM);
      setCoords(null);
      setImages([]);
      setVideos([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      const error = toApiError(caught);
      console.error("Submission error:", error);
      showError(
        (error.errors && error.errors.join(" ")) ||
          error.message ||
          "Failed to submit report. Please try again.",
      );
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Handler to close the Snackbar alert
  const handleCloseAlert = (_event?: SyntheticEvent | Event | null, reason?: string) => {
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
        <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Your feedback helps us improve public transport for everyone.
        </Typography>

        {receiptId && (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon fontSize="inherit" />}
            sx={{ mb: 4, borderRadius: 2, alignItems: "flex-start" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Report submitted. Thank you!
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Your Receipt ID is
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: 1, my: 0.5, fontFamily: "monospace" }}
            >
              {receiptId}
            </Typography>
            <Typography variant="body2">
              Save this ID to check on your report later.
              {emailSent && " We've also emailed you a copy of the receipt."}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                size="small"
                component={RouterLink}
                to={`/track/${encodeURIComponent(receiptId)}`}
              >
                Track this report
              </Button>
              {pdfUrl && (
                <Button variant="outlined" size="small" onClick={handleDownloadPdf}>
                  Download Receipt PDF
                </Button>
              )}
            </Box>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Honeypot field: invisible to people and screen readers */}
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
          />
          <StyledTextField
            fullWidth
            label="Bus Number (e.g., NE-9999)"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <DriveEtaIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <StyledTextField
            fullWidth
            label="Route Number (e.g., 08, Colombo-Matale)"
            name="routeNumber"
            value={formData.routeNumber}
            onChange={handleChange}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AltRouteIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <StyledTextField
            fullWidth
            label="Bus Name (Nuwantha Express)"
            name="busName"
            value={formData.busName}
            onChange={handleChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CommuteIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <StyledTextField
            select
            fullWidth
            label="What happened?"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </StyledTextField>
          <StyledTextField
            fullWidth
            type="datetime-local"
            label="When did it happen?"
            name="incidentAt"
            value={formData.incidentAt}
            onChange={handleChange}
            helperText="Leave empty if it just happened"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon color="action" />
                  </InputAdornment>
                ),
              },
              htmlInput: { max: nowForDateTimeInput() },
              inputLabel: { shrink: true },
            }}
          />
          <StyledTextField
            fullWidth
            label="Location of Incident (e.g., Ambepussa Junction)"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <LocationPicker value={coords} onChange={setCoords} />
          <StyledTextField
            fullWidth
            label="Description of Incident"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <StyledTextField
            fullWidth
            label="Your Email (for receipt)"
            name="passengerEmail"
            type="email"
            value={formData.passengerEmail}
            onChange={handleChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              },
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
                <IconButton
                  size="small"
                  aria-label="Remove file"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(255,255,255,0.85)",
                    "&:hover": { bgcolor: "white" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
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
                <IconButton
                  size="small"
                  aria-label="Remove file"
                  onClick={() => setVideos(videos.filter((_, i) => i !== index))}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(255,255,255,0.85)",
                    "&:hover": { bgcolor: "white" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </MediaPreview>
            ))}
          </PreviewContainer>

          <GradientButton
            size="large"
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Submit Report"}
          </GradientButton>
        </form>
      </FormContainer>

      <Snackbar
        open={alert.open}
        autoHideDuration={8000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled"
          icon={<ErrorOutlineIcon fontSize="inherit" />}
          sx={{
            width: "100%",
            minWidth: { xs: "90%", sm: "400px" },
            boxShadow: (theme) => theme.shadows[6],
            borderRadius: (theme) => theme.shape.borderRadius,
          }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SubmitReportPage;
