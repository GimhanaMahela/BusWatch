"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { errorMessage } from "@/api/apiClient";
import { getAssistantStatus, sendChat } from "@/api/assistantApi";
import { trackEvent } from "@/api/metricsApi";
import { WhatsAppButton } from "@/components/atoms";
import type { Language } from "@/constants/reportConstants";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { putDraftIntoForm } from "@/lib/reportDraft";
import type { AssistantLink, ChatMessage, ReportDraft } from "@/types/assistant";

const STORAGE_KEY = "buswatch:helper-chat";
// Keep in sync with ASSISTANT in api/src/config/constants.ts
const MAX_SENT_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

const LINK_PATHS: Record<AssistantLink, string> = {
  submit_report: "/submit-report",
  commend_driver: "/commend",
  track: "/track",
  my_reports: "/my-reports",
  impact: "/impact",
  about: "/about-us",
  privacy: "/privacy-policy",
};

const QUICK_STARTS = ["quickReport", "quickCommend", "quickTrack", "quickHow"] as const;

// The chat lasts for the browser tab, so it survives moving between pages and opening the form
const loadChat = (): { messages: ChatMessage[]; open: boolean } => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as {
      messages?: ChatMessage[];
      open?: boolean;
    } | null;
    return { messages: saved?.messages ?? [], open: Boolean(saved?.open) };
  } catch {
    return { messages: [], open: false };
  }
};

const saveChat = (messages: ChatMessage[], open: boolean) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, open }));
  } catch {
    // Storage blocked: the chat just won't survive a reload
  }
};

/** The latest part of the chat, starting with one of the passenger's messages. */
const forSending = (messages: ChatMessage[]) => {
  const recent = messages.slice(-MAX_SENT_MESSAGES);
  const start = recent.findIndex((message) => message.role === "user");
  return recent.slice(Math.max(start, 0)).map(({ role, text }) => ({ role, text }));
};

const bubbleSx = (mine: boolean) =>
  ({
    alignSelf: mine ? "flex-end" : "flex-start",
    maxWidth: "85%",
    px: 1.5,
    py: 1,
    borderRadius: 2.5,
    borderBottomRightRadius: mine ? 4 : undefined,
    borderBottomLeftRadius: mine ? undefined : 4,
    bgcolor: mine ? "primary.main" : "action.hover",
    color: mine ? "primary.contrastText" : "text.primary",
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
  }) as const;

function DraftCard({ draft, onOpen }: { draft: ReportDraft; onOpen: () => void }) {
  const t = useTranslations("helper");
  const tCategory = useTranslations("categories");
  const rows = [
    [t("draftCategory"), draft.category ? tCategory(draft.category) : ""],
    [t("draftBus"), draft.busNumber],
    [t("draftRoute"), draft.routeNumber],
    [t("draftPlace"), draft.location],
    [t("draftTime"), draft.incidentAt.replace("T", " ")],
  ].filter(([, value]) => value);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, alignSelf: "stretch" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {draft.type === "complaint" ? t("draftComplaint") : t("draftCommendation")}
      </Typography>
      {rows.map(([label, value]) => (
        <Typography key={label} variant="body2">
          <Box component="span" sx={{ color: "text.secondary" }}>
            {label}:
          </Box>{" "}
          {value}
        </Typography>
      ))}
      {draft.description && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "text.secondary",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {draft.description}
        </Typography>
      )}
      <Button
        variant="contained"
        size="small"
        startIcon={<EditNoteRoundedIcon />}
        onClick={onOpen}
        sx={{ mt: 1.25 }}
      >
        {t("openForm")}
      </Button>
      <Typography variant="caption" component="p" sx={{ mt: 0.75, color: "text.secondary" }}>
        {t("openFormHint")}
      </Typography>
    </Paper>
  );
}

/**
 * The TransitX helper: a chat bubble on public pages that answers questions about the service and
 * helps passengers put a report into words, then fills in the report form for them to check and
 * send. Hidden when the helper is switched off on the API.
 */
function ChatHelper() {
  const t = useTranslations("helper");
  const tc = useTranslations("common");
  const tw = useTranslations("whatsapp");
  const locale = useLocale() as Language;
  const online = useOnlineStatus();
  const router = useRouter();
  const pathname = usePathname();

  const { data: status } = useQuery({
    queryKey: ["assistantStatus"],
    queryFn: getAssistantStatus,
    staleTime: Infinity,
    retry: false,
  });

  // Nothing renders until the status query answers in the browser, so reading sessionStorage
  // here can't make the server and client renders differ
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat().messages);
  const [open, setOpen] = useState(() => loadChat().open);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => saveChat(messages, open), [messages, open]);

  const reply = useMutation({
    mutationFn: (conversation: ChatMessage[]) => sendChat(forSending(conversation), locale),
    onSuccess: (answer) =>
      setMessages((current) => [
        ...current,
        { role: "assistant", text: answer.reply, link: answer.link, draft: answer.draft },
      ]),
  });

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open, reply.isPending]);

  if (!status?.enabled) return null;

  const send = (message: string) => {
    const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed || reply.isPending) return;
    const next: ChatMessage[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setText("");
    reply.mutate(next, {
      // Give the message back so the passenger can try again
      onError: () => {
        setMessages(messages);
        setText(trimmed);
      },
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(text);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(text);
    }
  };

  const openForm = async (draft: ReportDraft) => {
    trackEvent("assistant_draft_opened");
    const href = await putDraftIntoForm(draft);
    // A form already on screen only reads its draft when it loads
    if (href === pathname) window.location.reload();
    else router.push(href);
  };

  const startOver = () => {
    reply.reset();
    setMessages([]);
    setText("");
  };

  // Only the newest draft can be opened: earlier ones are out of date
  const lastDraftIndex = messages.findLastIndex((message) => message.draft);

  if (!open) {
    return (
      <Fab
        variant="extended"
        color="primary"
        aria-label={t("open")}
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          right: 16,
          bottom: "calc(16px + env(safe-area-inset-bottom))",
          zIndex: "speedDial",
          textTransform: "none",
          gap: 1,
        }}
      >
        <ForumRoundedIcon />
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          {t("fab")}
        </Box>
      </Fab>
    );
  }

  return (
    <Paper
      role="dialog"
      aria-label={t("title")}
      elevation={12}
      sx={{
        position: "fixed",
        zIndex: "modal",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        inset: { xs: 0, sm: "auto 16px 16px auto" },
        width: { xs: "100%", sm: 380 },
        height: { xs: "100%", sm: "min(600px, calc(100vh - 32px))" },
        borderRadius: { xs: 0, sm: 3 },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          background: "var(--bw-gradient-brand)",
          color: "common.white",
        }}
      >
        <ForumRoundedIcon />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {t("title")}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {t("subtitle")}
          </Typography>
        </Box>
        <Tooltip title={t("newChat")}>
          <IconButton aria-label={t("newChat")} onClick={startOver} sx={{ color: "inherit" }}>
            <RestartAltRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={tc("close")}>
          <IconButton
            aria-label={tc("close")}
            onClick={() => setOpen(false)}
            sx={{ color: "inherit" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack
        aria-live="polite"
        sx={{ flex: 1, overflowY: "auto", gap: 1, p: 2, overscrollBehavior: "contain" }}
      >
        <Typography variant="body2" sx={bubbleSx(false)}>
          {t("greeting")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", px: 0.5 }}>
          {t("notice")}
        </Typography>
        {messages.length === 0 && (
          <WhatsAppButton
            label={tw("helperLink")}
            message={tw("hello")}
            variant="outlined"
            size="small"
            sx={{ alignSelf: "flex-start" }}
          />
        )}

        {messages.length === 0 && (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 0.5 }}>
            {QUICK_STARTS.map((key) => (
              <Chip
                key={key}
                label={t(key)}
                variant="outlined"
                color="primary"
                onClick={() => send(t(key))}
                disabled={!online}
              />
            ))}
          </Stack>
        )}

        {messages.map((message, index) => (
          <Stack key={index} sx={{ gap: 0.75 }}>
            <Typography variant="body2" sx={bubbleSx(message.role === "user")}>
              {message.text}
            </Typography>
            {message.link && !(message.draft && index === lastDraftIndex) && (
              <Button
                href={LINK_PATHS[message.link]}
                size="small"
                variant="outlined"
                sx={{ alignSelf: "flex-start" }}
              >
                {t(`links.${message.link}`)}
              </Button>
            )}
            {message.draft && index === lastDraftIndex && (
              <DraftCard draft={message.draft} onOpen={() => void openForm(message.draft!)} />
            )}
          </Stack>
        ))}

        {reply.isPending && (
          <Typography variant="body2" sx={{ ...bubbleSx(false), color: "text.secondary" }}>
            {t("thinking")}
          </Typography>
        )}
        {reply.isError && (
          <Alert severity="error" onClose={() => reply.reset()}>
            {errorMessage(reply.error, t("error"))}
          </Alert>
        )}
        <div ref={endRef} />
      </Stack>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          p: 1.5,
          pb: "calc(12px + env(safe-area-inset-bottom))",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        {online ? (
          <>
            <TextField
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              multiline
              maxRows={4}
              size="small"
              fullWidth
              autoFocus
              slotProps={{
                htmlInput: { maxLength: MAX_MESSAGE_LENGTH, "aria-label": t("placeholder") },
              }}
            />
            <IconButton
              type="submit"
              color="primary"
              aria-label={t("send")}
              disabled={!text.trim() || reply.isPending}
            >
              <SendRoundedIcon />
            </IconButton>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("offline")}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default ChatHelper;
