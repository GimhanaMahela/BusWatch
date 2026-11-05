"use client";

import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Alert, Box, Button, Card, TextField, Typography } from "@mui/material";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { errorMessage } from "@/api/apiClient";
import { useMarkReadByPassenger, useSendPassengerMessage } from "@/hooks/useReportQueries";
import type { PublicReport } from "@/types/report";

const MAX_MESSAGE = 2000;

/**
 * "Messages between admin and passenger" on the tracking page: the team asks for details
 * ("Which seat were you in?") and the passenger replies. Admin names are never shown.
 */
function ReportConversation({ report }: { report: PublicReport }) {
  const t = useTranslations("messages");
  const format = useFormatter();
  const send = useSendPassengerMessage(report.receiptId);
  const markRead = useMarkReadByPassenger(report.receiptId);
  const [draft, setDraft] = useState("");
  const [justSent, setJustSent] = useState(false);

  // Opening the page reads the team's messages (clears "new message" badges in My reports)
  const unreadFromTeam = report.messages.some((m) => m.sender === "admin" && !m.read);
  const markedFor = useRef<string | null>(null);
  const { mutate: markAsRead } = markRead;
  useEffect(() => {
    const latest = report.messages.at(-1)?.id ?? null;
    if (!unreadFromTeam || markedFor.current === latest) return;
    markedFor.current = latest;
    markAsRead();
  }, [unreadFromTeam, report.messages, markAsRead]);

  // Arriving from a "new message" email, SMS or notification
  useEffect(() => {
    if (window.location.hash === "#messages") {
      document.getElementById("messages")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setJustSent(false);
    send.mutate(body, {
      onSuccess: () => {
        setDraft("");
        setJustSent(true);
      },
    });
  };

  return (
    <Card id="messages" sx={{ p: { xs: 2.5, sm: 3 }, scrollMarginTop: 96 }}>
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <ForumRoundedIcon color="primary" fontSize="small" />
        {t("title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("subtitle")}
      </Typography>

      {report.messages.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", mb: 2 }}
        >
          {t("empty")}
        </Typography>
      ) : (
        <Box
          component="ol"
          aria-label={t("title")}
          sx={{ listStyle: "none", p: 0, m: 0, mb: 2, display: "grid", gap: 1.5 }}
        >
          {report.messages.map((message) => {
            const mine = message.sender === "passenger";
            return (
              <Box
                component="li"
                key={message.id}
                sx={{
                  justifySelf: mine ? "end" : "start",
                  maxWidth: "88%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: mine ? "flex-end" : "flex-start",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {mine ? t("you") : t("team")} ·{" "}
                  {format.dateTime(new Date(message.createdAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
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
                    color: mine ? "primary.contrastText" : "text.primary",
                    bgcolor: mine ? "primary.main" : "action.hover",
                    borderTopRightRadius: mine ? 4 : undefined,
                    borderTopLeftRadius: mine ? undefined : 4,
                  }}
                >
                  {message.body}
                </Typography>
                {mine && message.read && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}
                  >
                    <DoneAllRoundedIcon sx={{ fontSize: 14 }} />
                    {t("seen")}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {report.canReply ? (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1.5 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={8}
            label={t("label")}
            placeholder={t("placeholder")}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setJustSent(false);
            }}
            helperText={t("privacy")}
            slotProps={{ htmlInput: { maxLength: MAX_MESSAGE } }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendRoundedIcon />}
            loading={send.isPending}
            disabled={!draft.trim()}
            sx={{ justifySelf: "end" }}
          >
            {t("send")}
          </Button>
          {send.error && <Alert severity="error">{errorMessage(send.error, t("failed"))}</Alert>}
          {justSent && !send.error && <Alert severity="success">{t("sent")}</Alert>}
        </Box>
      ) : (
        <Alert severity="info">{t("closed")}</Alert>
      )}
    </Card>
  );
}

export default ReportConversation;
