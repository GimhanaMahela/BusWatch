"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/api/apiClient";
import { GradientButton, StatusChip } from "@/components/atoms";
import { DetailRow, EmptyState, LoadingState, SectionPanel } from "@/components/molecules";
import { STATUSES, categoryLabel, type ReportStatus } from "@/constants/reportConstants";
import useAuth from "@/hooks/useAuth";
import { useAddReportNote, useReport, useUpdateReportStatus } from "@/hooks/useReportQueries";
import { formatDateTime, timeAgo } from "@/lib/format";

type Media = { kind: "image" | "video"; url: string };

function MediaGallery({ media, receiptId }: { media: Media[]; receiptId: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const current = openIndex === null ? null : media[openIndex];
  const step = (delta: number) =>
    setOpenIndex((i) => (i === null ? i : (i + delta + media.length) % media.length));

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 1.5,
        }}
      >
        {media.map((m, index) => (
          <Box
            key={m.url}
            component="button"
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`Open ${m.kind} ${index + 1}`}
            sx={{
              all: "unset",
              position: "relative",
              aspectRatio: "4 / 3",
              borderRadius: 3,
              overflow: "hidden",
              cursor: "zoom-in",
              bgcolor: "action.hover",
              border: 1,
              borderStyle: "solid",
              borderColor: "divider",
              "& img, & video": {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.3s",
              },
              "&:hover img, &:hover video": { transform: "scale(1.05)" },
              "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main" },
            }}
          >
            {m.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote evidence, shown as uploaded
              <img
                src={m.url}
                alt={`Attachment ${index + 1} for report ${receiptId}`}
                loading="lazy"
              />
            ) : (
              <>
                <video src={m.url} muted preload="metadata" />
                <PlayCircleRoundedIcon
                  sx={{
                    position: "absolute",
                    inset: 0,
                    m: "auto",
                    fontSize: 48,
                    color: "common.white",
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                  }}
                />
              </>
            )}
          </Box>
        ))}
      </Box>

      <Dialog
        open={current !== null}
        onClose={() => setOpenIndex(null)}
        maxWidth="lg"
        fullWidth
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        slotProps={{ paper: { sx: { bgcolor: "#000", position: "relative", overflow: "hidden" } } }}
      >
        {current && (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              minHeight: "60vh",
              "& img, & video": { maxWidth: "100%", maxHeight: "85vh", display: "block" },
            }}
          >
            {current.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote evidence, shown as uploaded
              <img
                src={current.url}
                alt={`Attachment ${(openIndex ?? 0) + 1} for report ${receiptId}`}
              />
            ) : (
              <video src={current.url} controls autoPlay />
            )}
          </Box>
        )}
        <IconButton
          aria-label="Close"
          onClick={() => setOpenIndex(null)}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "common.white",
            bgcolor: "rgba(255,255,255,0.12)",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        {media.length > 1 && (
          <>
            <IconButton
              aria-label="Previous"
              onClick={() => step(-1)}
              sx={{
                position: "absolute",
                left: 12,
                top: "50%",
                color: "common.white",
                bgcolor: "rgba(255,255,255,0.12)",
              }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              aria-label="Next"
              onClick={() => step(1)}
              sx={{
                position: "absolute",
                right: 12,
                top: "50%",
                color: "common.white",
                bgcolor: "rgba(255,255,255,0.12)",
              }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </>
        )}
      </Dialog>
    </>
  );
}

function ReportDetailsView({ id }: { id: string }) {
  const { admin } = useAuth();
  const reportQuery = useReport(id);
  const report = reportQuery.data;
  const updateStatus = useUpdateReportStatus(id);
  const addNote = useAddReportNote(id);

  // null = "keep the current status" until the admin picks another one
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [notifyPassenger, setNotifyPassenger] = useState(true);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);

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

  const copyReceipt = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.receiptId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  if (reportQuery.isPending) return <LoadingState message="Loading report..." />;

  if (reportQuery.error || !report) {
    return (
      <Box sx={{ maxWidth: 560 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(reportQuery.error, "Report not found.")}
        </Alert>
        <Button href="/admin/dashboard" startIcon={<ArrowBackRoundedIcon />}>
          Back to reports
        </Button>
      </Box>
    );
  }

  const statusUnchanged = newStatus === report.status && !statusNote.trim();
  const media: Media[] = [
    ...report.images.map((url) => ({ kind: "image" as const, url })),
    ...report.videos.map((url) => ({ kind: "video" as const, url })),
  ];
  const hasPin = report.latitude != null && report.longitude != null;

  return (
    <>
      <Button
        href="/admin/dashboard"
        startIcon={<ArrowBackRoundedIcon />}
        color="inherit"
        sx={{ color: "text.secondary", mb: 2, ml: -1 }}
      >
        All reports
      </Button>

      <Box sx={{ display: "flex", alignItems: { sm: "center" }, gap: 2, flexWrap: "wrap", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            {report.receiptId}
          </Typography>
          <Tooltip title={copied ? "Copied!" : "Copy receipt ID"}>
            <IconButton
              aria-label="Copy receipt ID"
              onClick={() => void copyReceipt()}
              size="small"
            >
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <StatusChip status={report.status} />
      </Box>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {categoryLabel(report.category)} · reported {timeAgo(report.reportedAt)}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }} sx={{ display: "grid", gap: 3, alignContent: "start" }}>
          <SectionPanel title="Incident" icon={<DescriptionRoundedIcon fontSize="small" />}>
            <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>
              {report.description}
            </Typography>
            <Box
              sx={{
                mt: 3,
                pt: 2,
                borderTop: 1,
                borderColor: "divider",
                display: "grid",
                gridTemplateColumns: { sm: "1fr 1fr" },
                columnGap: 4,
              }}
            >
              <DetailRow label="Bus number">{report.busNumber}</DetailRow>
              <DetailRow label="Route">{report.routeNumber}</DetailRow>
              {report.busName && <DetailRow label="Bus name">{report.busName}</DetailRow>}
              <DetailRow label="Category">{categoryLabel(report.category)}</DetailRow>
              <DetailRow label="Location">{report.location}</DetailRow>
              {report.incidentAt && (
                <DetailRow label="Incident time">{formatDateTime(report.incidentAt)}</DetailRow>
              )}
              <DetailRow label="Reported">{formatDateTime(report.reportedAt)}</DetailRow>
              <DetailRow label="Passenger email">
                {report.passengerEmail || "Not provided"}
              </DetailRow>
            </Box>
            {hasPin && (
              <Button
                variant="outlined"
                startIcon={<MapRoundedIcon />}
                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 2 }}
              >
                Open pinned location in Maps
              </Button>
            )}
          </SectionPanel>

          <SectionPanel
            title="Evidence"
            subtitle={
              media.length
                ? `${report.images.length} photos · ${report.videos.length} videos`
                : undefined
            }
            icon={<PhotoLibraryRoundedIcon fontSize="small" />}
          >
            {media.length ? (
              <MediaGallery media={media} receiptId={report.receiptId} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No photos or videos were attached.
              </Typography>
            )}
          </SectionPanel>

          <SectionPanel
            title="Internal notes"
            subtitle="Only admins can see these."
            icon={<StickyNote2RoundedIcon fontSize="small" />}
          >
            {report.notes && report.notes.length > 0 ? (
              <Box sx={{ display: "grid", gap: 2, mb: 3 }}>
                {report.notes.map((note) => (
                  <Box key={note.id} sx={{ display: "flex", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        bgcolor: "secondary.main",
                      }}
                    >
                      {(note.author || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {note.author || "Unknown"}{" "}
                        <Typography component="span" variant="caption" color="text.secondary">
                          · {timeAgo(note.createdAt)}
                        </Typography>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "action.hover",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {note.text}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState
                icon={<StickyNote2RoundedIcon />}
                title="No notes yet"
                description="Keep context for your team here."
              />
            )}
            <Box
              component="form"
              onSubmit={handleAddNote}
              sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
            >
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={6}
                size="small"
                placeholder={`Add a note${admin ? ` as ${admin.email}` : ""}`}
                aria-label="New internal note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
              <Button
                type="submit"
                variant="contained"
                loading={addNote.isPending}
                disabled={!noteText.trim()}
                sx={{ minWidth: 0, px: 1.5, height: 40 }}
                aria-label="Add note"
              >
                <SendRoundedIcon fontSize="small" />
              </Button>
            </Box>
            {addNote.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage(addNote.error, "Failed to add note")}
              </Alert>
            )}
          </SectionPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 }, display: "grid", gap: 3 }}>
            <SectionPanel
              title="Update status"
              icon={<PublishedWithChangesRoundedIcon fontSize="small" />}
            >
              <Box component="form" onSubmit={handleStatusSubmit} sx={{ display: "grid", gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={newStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                  disabled={updateStatus.isPending}
                >
                  {STATUSES.map((st) => (
                    <MenuItem key={st.value} value={st.value}>
                      <StatusChip status={st.value} size="small" sx={{ cursor: "inherit" }} />
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Message to the passenger"
                  helperText="Optional. Shown on the public tracking page and in the email."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
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
                  slotProps={{ typography: { variant: "body2" } }}
                />
                <GradientButton
                  type="submit"
                  fullWidth
                  loading={updateStatus.isPending}
                  disabled={statusUnchanged}
                >
                  Save update
                </GradientButton>
                {updateStatus.error && (
                  <Alert severity="error">
                    {errorMessage(updateStatus.error, "Failed to update status")}
                  </Alert>
                )}
                {statusSuccess && !updateStatus.error && (
                  <Alert severity="success">{statusSuccess}</Alert>
                )}
              </Box>
            </SectionPanel>

            <SectionPanel title="Activity" icon={<HistoryRoundedIcon fontSize="small" />}>
              {report.statusHistory && report.statusHistory.length > 0 ? (
                <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {[...report.statusHistory].reverse().map((entry, index, list) => (
                    <Box
                      component="li"
                      key={`${entry.changedAt}-${index}`}
                      sx={{ display: "flex", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          pt: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: index === 0 ? "primary.main" : "text.disabled",
                          }}
                        />
                        {index < list.length - 1 && (
                          <Box sx={{ width: 2, flex: 1, bgcolor: "divider", my: 0.5 }} />
                        )}
                      </Box>
                      <Box sx={{ pb: 2.5, minWidth: 0 }}>
                        <StatusChip status={entry.status} size="small" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="p"
                          sx={{ mt: 0.5 }}
                        >
                          {formatDateTime(entry.changedAt)}
                          {entry.changedBy ? ` · ${entry.changedBy}` : ""}
                        </Typography>
                        {entry.note && (
                          <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-line" }}>
                            {entry.note}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No status changes recorded yet.
                </Typography>
              )}
            </SectionPanel>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default ReportDetailsView;
