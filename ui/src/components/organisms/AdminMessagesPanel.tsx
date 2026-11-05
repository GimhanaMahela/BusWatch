"use client";

import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { errorMessage } from "@/api/apiClient";
import { SectionPanel } from "@/components/molecules";
import { useMarkReadByAdmin, useSendAdminMessage } from "@/hooks/useReportQueries";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { Delivery, Report } from "@/types/report";

/** "The passenger was notified by email, SMS and browser notification (1 device)." */
export const describeDelivery = (delivery: Delivery) => {
  const channels = [
    delivery.email && "email",
    delivery.sms && "SMS",
    delivery.push > 0 &&
      `browser notification (${delivery.push} device${delivery.push === 1 ? "" : "s"})`,
    delivery.telegram > 0 &&
      `Telegram (${delivery.telegram} chat${delivery.telegram === 1 ? "" : "s"})`,
  ].filter((channel): channel is string => Boolean(channel));
  if (channels.length === 0) {
    return "Saved. The passenger has no email, phone, notifications or Telegram on file, so they'll see it on their tracking page.";
  }
  const list =
    channels.length > 1
      ? `${channels.slice(0, -1).join(", ")} and ${channels.at(-1)}`
      : channels[0];
  return `Saved. The passenger was notified by ${list}.`;
};

/**
 * Admin side of "Messages between admin and passenger": ask for details, read replies.
 * The passenger sees "BusWatch team", never the admin's email.
 */
function AdminMessagesPanel({ report }: { report: Report }) {
  const send = useSendAdminMessage(report.id);
  const markRead = useMarkReadByAdmin(report.id);
  const [draft, setDraft] = useState("");
  const [notify, setNotify] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const messages = report.messages ?? [];

  // Opening the report reads the passenger's messages (clears the badge in the reports table)
  const unread = messages.some((m) => m.sender === "passenger" && !m.readAt);
  const done = useRef(false);
  const { mutate: markAsRead } = markRead;
  useEffect(() => {
    if (!unread || done.current) return;
    done.current = true;
    markAsRead();
  }, [unread, markAsRead]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setResult(null);
    send.mutate(
      { body, notifyPassenger: notify },
      {
        onSuccess: (updated) => {
          setDraft("");
          setResult(
            notify ? describeDelivery(updated.delivery) : "Sent without notifying the passenger.",
          );
        },
      },
    );
  };

  return (
    <SectionPanel
      title="Messages with the passenger"
      subtitle="Shown on their tracking page as “BusWatch team”."
      icon={<ForumRoundedIcon fontSize="small" />}
    >
      {messages.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No messages yet. Ask the passenger for details they didn’t include, e.g. “Which seat were
          you in?”
        </Typography>
      ) : (
        <Box
          component="ol"
          sx={{ listStyle: "none", p: 0, m: 0, mb: 3, display: "grid", gap: 1.5 }}
        >
          {messages.map((message) => {
            const team = message.sender === "admin";
            return (
              <Box
                component="li"
                key={message.id}
                sx={{
                  justifySelf: team ? "end" : "start",
                  maxWidth: "85%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: team ? "flex-end" : "flex-start",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  title={formatDateTime(message.createdAt) ?? undefined}
                >
                  <strong>{team ? (message.author ?? "Team") : "Passenger"}</strong> ·{" "}
                  {timeAgo(message.createdAt)}
                  {team && (message.readAt ? " · read" : " · not read yet")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 3,
                    whiteSpace: "pre-line",
                    overflowWrap: "anywhere",
                    color: team ? "primary.contrastText" : "text.primary",
                    bgcolor: team ? "primary.main" : "action.hover",
                  }}
                >
                  {message.body}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1.5 }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={8}
          label="Message to the passenger"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <FormControlLabel
            sx={{ flex: 1, minWidth: 220 }}
            control={<Checkbox checked={notify} onChange={(e) => setNotify(e.target.checked)} />}
            label="Notify them (email, SMS, browser notifications and Telegram they signed up for)"
            slotProps={{ typography: { variant: "body2" } }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendRoundedIcon />}
            loading={send.isPending}
            disabled={!draft.trim()}
          >
            Send
          </Button>
        </Box>
        {send.error && <Alert severity="error">{errorMessage(send.error, "Failed to send")}</Alert>}
        {result && !send.error && <Alert severity="success">{result}</Alert>}
      </Box>
    </SectionPanel>
  );
}

export default AdminMessagesPanel;
