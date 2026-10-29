// src/pages/ReportDetailsPage.js
import { useState, type FormEvent } from "react";
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
  Card,
  CardContent,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { errorMessage } from "../../api/apiClient";
import { useAddReportNote, useReport, useUpdateReportStatus } from "../../hooks/useReportQueries";
import { STATUSES, categoryLabel, type ReportStatus } from "../../constants/reportConstants";
import useAuth from "../../hooks/useAuth";
import { GradientButton, StatusChip } from "../../components/atoms";
import { LoadingState } from "../../components/molecules";
import { useParams, useNavigate } from "react-router";

// Icons for report details
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusAlertIcon from "@mui/icons-material/BusAlert";
import RouteIcon from "@mui/icons-material/Route";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import VideocamIcon from "@mui/icons-material/Videocam";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CategoryIcon from "@mui/icons-material/Category";
import EventIcon from "@mui/icons-material/Event";
import HistoryIcon from "@mui/icons-material/History";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";

const PageWrapper = styled(Box)(({ theme }) => ({
  background: `linear-gradient(to bottom right, ${theme.palette.background.default}, ${theme.palette.grey[100]})`,
  minHeight: "calc(100vh - 64px)",
  padding: theme.spacing(4, 0),
}));

const DetailContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: Number(theme.shape.borderRadius) * 3,
  boxShadow: theme.shadows[15],
  background: `linear-gradient(160deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  border: `1px solid ${theme.palette.grey[200]}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(8),
  },
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: `2px solid ${theme.palette.primary.light}`,
  marginBottom: theme.spacing(3),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  boxShadow: theme.shadows[6],
  background: theme.palette.background.paper,
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[10],
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.dark,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px dashed ${theme.palette.grey[300]}`,
}));

const SubSectionTitle = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1.5),
  fontWeight: 600,
  color: theme.palette.text.secondary,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const InfoText = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  color: theme.palette.text.primary,
  "& strong": {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
}));

const MediaGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const MediaItem = styled(Box)(({ theme }) => ({
  width: "100%",
  minHeight: "200px", // Ensure a minimum height for visibility
  // Removed paddingTop to allow natural aspect ratio
  position: "relative",
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  border: `3px solid ${theme.palette.grey[300]}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  boxShadow: theme.shadows[4],
  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.03) translateY(-5px)",
    boxShadow: theme.shadows[8],
  },

  "& img, & video": {
    // Rely on width: 100% and height: auto for natural scaling
    width: "100%",
    height: "auto", // Allow natural height based on content
    objectFit: "contain", // Changed to contain to show full image/video
    position: "relative", // Changed from absolute to relative for natural flow
    top: "auto", // Reset top
    left: "auto", // Reset left
  },
}));

const StyledOutlinedButton = styled(Button)(({ theme }) => ({
  fontSize: "1.0rem",
  padding: theme.spacing(1.5, 4),
  borderRadius: 50,
  fontWeight: 700,
  borderColor: theme.palette.primary.main,
  color: theme.palette.primary.main,
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    background: `rgba(${theme.palette.primary.main}, 0.08)`,
    borderColor: theme.palette.primary.dark,
    color: theme.palette.primary.dark,
    transform: "translateY(-2px)",
    boxShadow: `0 4px 8px rgba(${theme.palette.primary.main},.2)`,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[400],
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.dark,
    boxShadow: `0 0 0 3px ${theme.palette.primary.light}60`,
  },
  "& .MuiSelect-select": {
    paddingRight: theme.spacing(4),
  },
})) as unknown as typeof Select;

function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const reportQuery = useReport(id ?? "");
  const report = reportQuery.data;
  const updateStatus = useUpdateReportStatus(id ?? "");
  const addNote = useAddReportNote(id ?? "");

  // null = "keep the current status" until the admin picks another one
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [notifyPassenger, setNotifyPassenger] = useState(true);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const newStatus = selectedStatus ?? report?.status ?? "pending";

  const handleStatusSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusSuccess(null);
    updateStatus.mutate(
      { status: newStatus, note: statusNote.trim(), notifyPassenger },
      {
        onSuccess: (updated) => {
          setSelectedStatus(null);
          setStatusNote("");
          setStatusSuccess(
            updated.emailSent ? "Status updated and the passenger was emailed." : "Status updated.",
          );
        },
      },
    );
  };

  const handleAddNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    addNote.mutate(noteText.trim(), { onSuccess: () => setNoteText("") });
  };

  const statusUnchanged = Boolean(report && newStatus === report.status && !statusNote.trim());
  const statusMessage = updateStatus.error
    ? {
        severity: "error" as const,
        text: errorMessage(updateStatus.error, "Failed to update status"),
      }
    : statusSuccess
      ? { severity: "success" as const, text: statusSuccess }
      : null;
  const savingStatus = updateStatus.isPending;
  const savingNote = addNote.isPending;
  const noteError = addNote.error ? errorMessage(addNote.error, "Failed to add note") : null;

  if (reportQuery.isPending) {
    return <LoadingState message="Loading report details..." />;
  }

  if (reportQuery.error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {errorMessage(reportQuery.error, "Failed to fetch report details")}
        </Alert>
        <GradientButton onClick={() => void reportQuery.refetch()}>Retry</GradientButton>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Report not found.
        </Alert>
      </Container>
    );
  }

  return (
    <PageWrapper>
      <Container maxWidth="md">
        <DetailContainer elevation={3}>
          <HeaderSection>
            <StyledOutlinedButton
              onClick={() => navigate("/admin/dashboard")}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              Back to Dashboard
            </StyledOutlinedButton>
            <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 700, ml: 2 }}>
              <AssignmentIcon sx={{ mr: 1, verticalAlign: "middle" }} /> Report ID:{" "}
              {report.receiptId}
            </Typography>
          </HeaderSection>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <StyledCard>
                <CardContent>
                  <SectionTitle variant="h5">
                    <BusAlertIcon /> Report Information
                  </SectionTitle>
                  <InfoText>
                    <strong>Bus Number:</strong> {report.busNumber}
                  </InfoText>
                  <InfoText>
                    <RouteIcon /> <strong>Route Number:</strong> {report.routeNumber}
                  </InfoText>
                  {report.busName && (
                    <InfoText>
                      <BusAlertIcon /> <strong>Bus Name:</strong> {report.busName}
                    </InfoText>
                  )}
                  <InfoText>
                    <CategoryIcon /> <strong>Category:</strong> {categoryLabel(report.category)}
                  </InfoText>
                  <InfoText>
                    <LocationOnIcon /> <strong>Location:</strong> {report.location}
                    {report.latitude != null && report.longitude != null && (
                      <Link
                        href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ ml: 1 }}
                      >
                        (view on map)
                      </Link>
                    )}
                  </InfoText>
                  {report.incidentAt && (
                    <InfoText>
                      <EventIcon /> <strong>Incident Time:</strong>{" "}
                      {new Date(report.incidentAt).toLocaleString()}
                    </InfoText>
                  )}
                  <InfoText>
                    <CalendarTodayIcon /> <strong>Reported At:</strong>{" "}
                    {new Date(report.reportedAt).toLocaleString()}
                  </InfoText>
                  <InfoText>
                    <CheckCircleOutlineIcon /> <strong>Current Status:</strong>{" "}
                    <StatusChip status={report.status} uppercase sx={{ minWidth: 80 }} />
                  </InfoText>
                  {report.passengerEmail && (
                    <InfoText>
                      <EmailIcon /> <strong>Passenger Email:</strong> {report.passengerEmail}
                    </InfoText>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <StyledCard>
                <CardContent>
                  <SectionTitle variant="h5">
                    <DescriptionIcon /> Incident Details
                  </SectionTitle>
                  <Typography
                    component="p"
                    variant="body1"

                    sx={{ mb: 3, color: "text.secondary" }}
                  >
                    {report.description}
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <SectionTitle variant="h5">
                    <CheckCircleOutlineIcon /> Update Status
                  </SectionTitle>
                  <Box component="form" onSubmit={handleStatusSubmit}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="status-select-label">Change Status</InputLabel>
                      <StyledSelect
                        labelId="status-select-label"
                        id="status-select"
                        value={newStatus}
                        label="Change Status"
                        onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                        disabled={savingStatus}
                      >
                        {STATUSES.map((st) => (
                          <MenuItem key={st.value} value={st.value}>
                            {st.label}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Message to the passenger (optional)"
                      helperText="Shown on the public tracking page and in the email"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}

                      sx={{ mb: 1 }}
                      slotProps={{ htmlInput: { maxLength: 2000 } }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={notifyPassenger && Boolean(report.passengerEmail)}
                          onChange={(e) => setNotifyPassenger(e.target.checked)}
                          disabled={!report.passengerEmail}
                        />
                      }
                      label={
                        report.passengerEmail
                          ? "Email the passenger about this update"
                          : "No passenger email on file"
                      }
                    />
                    <Box sx={{ mt: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={savingStatus || statusUnchanged}
                      >
                        {savingStatus ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Update status"
                        )}
                      </Button>
                    </Box>
                    {statusMessage && (
                      <Alert severity={statusMessage.severity} sx={{ mt: 2, borderRadius: 2 }}>
                        {statusMessage.text}
                      </Alert>
                    )}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <StyledCard>
                <CardContent>
                  <SectionTitle variant="h5">
                    <HistoryIcon /> Status History
                  </SectionTitle>
                  {report.statusHistory && report.statusHistory.length > 0 ? (
                    <List dense disablePadding>
                      {[...report.statusHistory].reverse().map((entry, index) => (
                        <ListItem key={index} disableGutters alignItems="flex-start">
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <StatusChip size="small" status={entry.status} />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(entry.changedAt).toLocaleString()}
                                  {entry.changedBy ? ` by ${entry.changedBy}` : ""}
                                </Typography>
                              </Box>
                            }
                            secondary={entry.note}
                            slotProps={{ secondary: { sx: { mt: 0.5, whiteSpace: "pre-line" } } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No status changes recorded yet.
                    </Typography>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <StyledCard>
                <CardContent>
                  <SectionTitle variant="h5">
                    <StickyNote2Icon /> Internal Notes
                  </SectionTitle>
                  <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
                    Only admins can see these.
                  </Typography>
                  {report.notes && report.notes.length > 0 ? (
                    <List dense disablePadding sx={{ mb: 2 }}>
                      {report.notes.map((note) => (
                        <ListItem key={note.id} disableGutters alignItems="flex-start">
                          <ListItemText
                            primary={note.text}

                            secondary={`${note.author || "Unknown"} · ${new Date(note.createdAt).toLocaleString()}`}
                            slotProps={{ primary: { sx: { whiteSpace: "pre-line" } } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No notes yet.
                    </Typography>
                  )}
                  <Box component="form" onSubmit={handleAddNote}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label={`Add a note${admin ? ` as ${admin.email}` : ""}`}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}

                      sx={{ mb: 1 }}
                      slotProps={{ htmlInput: { maxLength: 2000 } }}
                    />
                    <Button
                      type="submit"
                      variant="outlined"
                      disabled={savingNote || !noteText.trim()}
                    >
                      {savingNote ? <CircularProgress size={20} /> : "Add note"}
                    </Button>
                    {noteError && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                        {noteError}
                      </Alert>
                    )}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          {/* Attached Media Section */}
          {(report.images && report.images.length > 0) ||
          (report.videos && report.videos.length > 0) ? (
            <StyledCard>
              <CardContent>
                <SectionTitle variant="h5">
                  <PhotoLibraryIcon /> Attached Media
                </SectionTitle>
                {report.images && report.images.length > 0 && (
                  <>
                    <SubSectionTitle>
                      <CameraAltIcon sx={{ mr: 1 }} />
                      <Typography
                        component="span"
                        variant="inherit"
                        sx={{ fontWeight: "inherit", color: "inherit" }}
                      >
                        Images
                      </Typography>
                    </SubSectionTitle>
                    <MediaGrid container spacing={3}>
                      {report.images.map((imgUrl, index) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                          <MediaItem>
                            <img
                              src={imgUrl}
                              alt={`Attachment ${index + 1} for report ID ${report.receiptId}`}
                              onError={(e) => {
                                console.error(`Failed to load image: ${imgUrl}`, e);
                                e.currentTarget.src =
                                  "https://placehold.co/150x150/E0E0E0/ADADAD?text=Image+Error";
                              }}
                            />
                          </MediaItem>
                        </Grid>
                      ))}
                    </MediaGrid>
                  </>
                )}

                {report.videos && report.videos.length > 0 && (
                  <>
                    <SubSectionTitle
                      sx={{
                        mt: report.images && report.images.length > 0 ? 4 : 0,
                      }}
                    >
                      <VideocamIcon sx={{ mr: 1 }} />
                      <Typography
                        component="span"
                        variant="inherit"
                        sx={{ fontWeight: "inherit", color: "inherit" }}
                      >
                        Videos
                      </Typography>
                    </SubSectionTitle>
                    <MediaGrid container spacing={3}>
                      {report.videos.map((videoUrl, index) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                          <MediaItem>
                            <video
                              controls
                              src={videoUrl}
                              style={{ width: "100%", height: "auto" }}
                              onError={(e) => console.error(`Failed to load video: ${videoUrl}`, e)}
                            />
                          </MediaItem>
                        </Grid>
                      ))}
                    </MediaGrid>
                  </>
                )}
              </CardContent>
            </StyledCard>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2, mt: 3 }}>
              No attached media for this report.
            </Alert>
          )}
        </DetailContainer>
      </Container>
    </PageWrapper>
  );
}

export default ReportDetailsPage;
