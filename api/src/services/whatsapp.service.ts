import { createHmac, timingSafeEqual } from "node:crypto";
import cloudinary from "../config/cloudinary.js";
import { UPLOAD_LIMITS, WHATSAPP, type Language } from "../config/constants.js";
import { env, frontendUrl } from "../config/env.js";
import type { WhatsAppMedia, WhatsAppTurn } from "../db/schema.js";
import { DATE_LOCALES, messagesFor } from "../i18n/messages.js";
import { countEvent } from "../repositories/metric.repository.js";
import { findReportByReceiptId } from "../repositories/report.repository.js";
import {
  appendWhatsAppMedia,
  claimWhatsAppDraft,
  forgetWhatsAppNumber,
  isWhatsAppFollowing,
  lastInboundTimes,
  listWhatsAppFollowers,
  markInboundHandled,
  openWhatsAppChat,
  recordInbound,
  resetWhatsAppChat,
  saveWhatsAppSubscription,
  updateWhatsAppChat,
  type WhatsAppChat,
} from "../repositories/whatsapp.repository.js";
import { AiServiceError, AiUnavailableError } from "./ai.service.js";
import {
  chat as askAssistant,
  isAssistantEnabled,
  type ChatMessage,
  type ReportDraft,
} from "./assistant.service.js";
import { trackingUrl } from "./email.service.js";
import { fileReport } from "./report-submission.service.js";

// The BusWatch WhatsApp bot, on Meta's WhatsApp Cloud API
// (https://developers.facebook.com/docs/whatsapp/cloud-api). Passengers can:
// - report a problem or praise a driver by chatting with the BusWatch helper (the same AI as the
//   website's chat bubble), with photos, videos, voice notes and a shared location. The bot shows
//   the finished report and only files it when the passenger presses "Send report".
// - send a receipt ID to see a report's status, and follow it for updates here.
// - send STOP to stop all updates and have the conversation forgotten.
//
// Meta calls FRONTEND_URL/api/whatsapp/webhook with each message, signed with the app secret.
// Replies to a passenger are free within 24 hours of their last message; after that WhatsApp only
// allows approved templates (WHATSAPP_UPDATE_TEMPLATE), so updates outside that window use one.

const TIMEOUT_MS = 15_000;
const MEDIA_TIMEOUT_MS = 60_000;
const HOUR_MS = 60 * 60 * 1000;
/** WhatsApp limits: text messages 4096 characters, interactive message bodies 1024 */
const MAX_TEXT = 4096;
const MAX_BODY = 1024;

export const isWhatsAppConfigured = (): boolean =>
  Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);

/** Messages are only accepted with a way to check Meta's signature on them. */
export const whatsAppReceivesMessages = (): boolean =>
  isWhatsAppConfigured() && Boolean(env.WHATSAPP_APP_SECRET);

/** The number for "Chat on WhatsApp" buttons (+94771234567), or null when the bot is off. */
export const whatsAppDisplayNumber = (): string | null =>
  whatsAppReceivesMessages() ? (env.WHATSAPP_DISPLAY_NUMBER ?? null) : null;

export class WhatsAppError extends Error {
  constructor(
    readonly status: number,
    readonly code: number | undefined,
    description: string,
  ) {
    super(`WhatsApp error ${code ?? status}: ${description}`);
    this.name = "WhatsAppError";
  }
}

const graphUrl = (path: string) => `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${path}`;

const authHeader = () => ({ Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN ?? ""}` });

const throwGraphError = async (response: Response): Promise<never> => {
  const result = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; code?: number };
  };
  throw new WhatsAppError(
    response.status,
    result.error?.code,
    result.error?.message ?? `HTTP ${response.status}`,
  );
};

// ------------------------------------------------------------------ Sending

/** WhatsApp numbers are digits only: "+94771234567" -> "94771234567". */
const waId = (phone: string) => phone.replace(/^\+/, "");

const send = async (to: string, message: Record<string, unknown>) => {
  const response = await fetch(graphUrl(`${env.WHATSAPP_PHONE_NUMBER_ID}/messages`), {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: waId(to),
      ...message,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) await throwGraphError(response);
};

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

export const sendWhatsAppText = (to: string, text: string) =>
  send(to, { type: "text", text: { body: clip(text, MAX_TEXT), preview_url: false } });

interface ReplyButton {
  id: string;
  title: string;
}

/** A message with up to three reply buttons (titles of at most 20 characters). */
const sendButtons = (to: string, body: string, buttons: ReplyButton[]) =>
  send(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: clip(body, MAX_BODY) },
      action: {
        buttons: buttons.slice(0, 3).map(({ id, title }) => ({
          type: "reply",
          reply: { id, title: clip(title, 20) },
        })),
      },
    },
  });

const sendDocument = (to: string, link: string, filename: string, caption: string) =>
  send(to, { type: "document", document: { link, filename, caption } });

/** Template language codes; a missing translation falls back to English. */
const TEMPLATE_LANGUAGES: Record<Language, string> = { en: "en", si: "si", ta: "ta" };
/** Meta: "Template name does not exist in the translation" */
const TEMPLATE_MISSING_TRANSLATION = 132001;

const sendTemplate = async (to: string, language: Language, params: string[]) => {
  const message = (code: string) => ({
    type: "template",
    template: {
      name: env.WHATSAPP_UPDATE_TEMPLATE,
      language: { code },
      components: [
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text: clip(text, 900) })),
        },
      ],
    },
  });
  try {
    await send(to, message(TEMPLATE_LANGUAGES[language]));
  } catch (error) {
    if (
      language !== "en" &&
      error instanceof WhatsAppError &&
      error.code === TEMPLATE_MISSING_TRANSLATION
    ) {
      await send(to, message(TEMPLATE_LANGUAGES.en));
      return;
    }
    throw error;
  }
};

// ------------------------------------------------------------------ Receiving media

/** Downloads a photo, video or voice note the passenger sent (two steps: find it, then fetch it). */
const downloadMedia = async (mediaId: string) => {
  const info = await fetch(graphUrl(mediaId), {
    headers: authHeader(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!info.ok) await throwGraphError(info);
  const { url, mime_type: mimeType } = (await info.json()) as { url: string; mime_type: string };
  const file = await fetch(url, {
    headers: authHeader(),
    signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
  });
  if (!file.ok) await throwGraphError(file);
  return { mimeType, data: Buffer.from(await file.arrayBuffer()) };
};

const uploadToCloudinary = async (media: WhatsAppMedia) => {
  const { mimeType, data } = await downloadMedia(media.id);
  if (data.length > UPLOAD_LIMITS.maxFileBytes * (media.kind === "video" ? 5 : 1)) {
    throw new Error("Media file is too large");
  }
  const result = await cloudinary.uploader.upload(
    `data:${mimeType};base64,${data.toString("base64")}`,
    { resource_type: media.kind },
  );
  return result.secure_url;
};

// ------------------------------------------------------------------ Webhook

/** Constant-time check of Meta's X-Hub-Signature-256 header ("sha256=<hex HMAC of the body>"). */
export const isValidSignature = (rawBody: Buffer, header: unknown) => {
  const secret = env.WHATSAPP_APP_SECRET;
  if (!secret || typeof header !== "string") return false;
  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`,
  );
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
};

/** Meta's one-off check when the webhook URL is registered: echo the challenge back. */
export const verifySubscription = (query: Record<string, unknown>) =>
  query["hub.mode"] === "subscribe" &&
  Boolean(env.WHATSAPP_VERIFY_TOKEN) &&
  query["hub.verify_token"] === env.WHATSAPP_VERIFY_TOKEN &&
  typeof query["hub.challenge"] === "string"
    ? query["hub.challenge"]
    : null;

interface MediaPayload {
  id: string;
  mime_type?: string;
  caption?: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  /** Quick-reply button on a template message */
  button?: { payload?: string; text?: string };
  image?: MediaPayload;
  video?: MediaPayload;
  audio?: MediaPayload & { voice?: boolean };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
}

export interface WhatsAppWebhook {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: WhatsAppMessage[];
      };
    }[];
  }[];
}

/** Handles every message in a webhook call (delivery receipts and other events are ignored). */
export const handleWhatsAppWebhook = async (payload: WhatsAppWebhook) => {
  if (payload.object !== "whatsapp_business_account") return;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (change.field !== "messages" || !value?.messages) continue;
      // Only messages to our own number (one Meta app can have several)
      if (value.metadata?.phone_number_id !== env.WHATSAPP_PHONE_NUMBER_ID) continue;
      for (const message of value.messages) {
        if (!(await markInboundHandled(message.id))) continue;
        await handleWhatsAppMessage(message).catch((error: unknown) =>
          console.error("WhatsApp message failed:", error instanceof Error ? error.message : error),
        );
      }
    }
  }
};

// ------------------------------------------------------------------ Conversation

const RECEIPT_ID = /\bBW-\d{4}-[2-9A-HJ-NP-Z]{6}\b/i;
const STOP_WORDS = new Set(["STOP", "UNSUBSCRIBE", "නවත්වන්න", "நிறுத்து", "நிறுத்தவும்"]);
const MENU_WORDS = new Set(["MENU", "HELP", "START", "උදව්", "உதவி"]);
const GREETINGS =
  /^(hi+|hello|hey|ayubowan|ආයුබෝවන්|හලෝ|vanakkam|வணக்கம்|good (morning|afternoon|evening))[\s!.]*$/i;

/** The language a message is written in, by its script; Latin script keeps the current one. */
const detectLanguage = (text: string, current: Language): Language => {
  if (/[඀-෿]/.test(text)) return "si";
  if (/[஀-௿]/.test(text)) return "ta";
  return current;
};

const formatDate = (date: Date, language: Language) =>
  new Intl.DateTimeFormat(DATE_LOCALES[language], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(date);

const formUrl = (path: string) => (frontendUrl ? `${frontendUrl}${path}` : "");

/** What the passenger tapped: reply buttons, list items and template quick replies. */
const buttonId = (message: WhatsAppMessage) =>
  message.interactive?.button_reply?.id ??
  message.interactive?.list_reply?.id ??
  message.button?.payload ??
  null;

const menuButtons = (language: Language): ReplyButton[] => {
  const b = messagesFor(language).whatsapp.buttons;
  return [
    { id: "menu:report", title: b.report },
    { id: "menu:commend", title: b.commend },
    { id: "menu:track", title: b.track },
  ];
};

const sendWelcome = async (phone: string, language: Language) => {
  const t = messagesFor(language).whatsapp;
  if (!isAssistantEnabled()) {
    await sendWhatsAppText(phone, t.welcomeNoAi(formUrl("/submit-report")));
    return;
  }
  await sendButtons(phone, t.welcome, menuButtons(language));
};

/** Is everything a report needs there, so it can be sent? */
export const isDraftComplete = (draft: ReportDraft | null): draft is ReportDraft =>
  Boolean(
    draft?.description &&
    draft.busNumber &&
    draft.routeNumber &&
    (draft.type === "commendation" || draft.location),
  );

const countMedia = (media: WhatsAppMedia[]) => ({
  photos: media.filter((item) => item.kind === "image").length,
  videos: media.filter((item) => item.kind === "video").length,
});

/** The finished report, for the passenger to check before pressing Send. */
export const draftSummary = (chat: WhatsAppChat, draft: ReportDraft) => {
  const t = messagesFor(chat.language);
  const w = t.whatsapp;
  const { photos, videos } = countMedia(chat.media);
  const incidentAt = draft.incidentAt ? new Date(`${draft.incidentAt}:00+05:30`) : null;
  const lines = [
    `*${w.checkTitle[draft.type]}*`,
    "",
    draft.category && `*${w.labels.category}:* ${t.categories[draft.category]}`,
    `*${w.labels.bus}:* ${draft.busNumber}`,
    `*${w.labels.route}:* ${draft.routeNumber}`,
    draft.location && `*${w.labels.place}:* ${draft.location}`,
    incidentAt && `*${w.labels.when}:* ${formatDate(incidentAt, chat.language)}`,
    (photos || videos) && `*${w.labels.media}:* ${w.mediaCount(photos, videos)}`,
    chat.latitude !== null && `*${w.labels.pin}:* ✓`,
  ].filter((line): line is string => typeof line === "string");
  const head = lines.join("\n");
  const footer = `\n\n${w.checkFooter}`;
  const room = MAX_BODY - head.length - footer.length - `\n\n*${w.labels.description}:*\n`.length;
  return `${head}\n\n*${w.labels.description}:*\n${clip(draft.description, Math.max(room, 80))}${footer}`;
};

const askToConfirm = async (chat: WhatsAppChat, draft: ReportDraft) => {
  const b = messagesFor(chat.language).whatsapp.buttons;
  await updateWhatsAppChat(chat.phone, { awaitingConfirmation: true });
  await sendButtons(chat.phone, draftSummary(chat, draft), [
    { id: "draft:send", title: b.send },
    { id: "draft:change", title: b.change },
    { id: "draft:cancel", title: b.cancel },
  ]);
};

const ASSISTANT_PATHS = {
  submit_report: "/submit-report",
  commend_driver: "/commend-a-driver",
  track: "/track",
  my_reports: "/my-reports",
  impact: "/impact",
  about: "/about-us",
  privacy: "/privacy-policy",
} as const;

/** A note for the AI about what is already attached (not shown to the passenger or kept). */
const attachmentNote = (chat: WhatsAppChat) => {
  const { photos, videos } = countMedia(chat.media);
  const parts = [
    photos && `${photos} photo(s)`,
    videos && `${videos} video(s)`,
    chat.latitude !== null && "their location",
  ].filter(Boolean);
  return parts.length ? `\n\n[The passenger has already sent ${parts.join(", ")}.]` : "";
};

/** One turn with the BusWatch helper: a typed message or a voice note. */
const converse = async (
  chat: WhatsAppChat,
  input: { text: string } | { audio: { mimeType: string; data: Buffer } },
) => {
  const t = messagesFor(chat.language).whatsapp;
  if (!isAssistantEnabled()) {
    await sendWelcome(chat.phone, chat.language);
    return;
  }
  const history = chat.history.slice(-WHATSAPP.maxHistory);
  const messages: ChatMessage[] = [...history];
  if ("text" in input) {
    messages.push({ role: "user", text: input.text + attachmentNote(chat) });
  } else if (messages.length === 0 && attachmentNote(chat)) {
    messages.push({ role: "user", text: attachmentNote(chat).trim() });
  }

  let answer;
  try {
    answer = await askAssistant(messages, chat.language, {
      channel: "whatsapp",
      ...("audio" in input && { audio: input.audio }),
    });
  } catch (error) {
    if (error instanceof AiUnavailableError || error instanceof AiServiceError) {
      console.error("WhatsApp helper failed:", error.message);
      await sendWhatsAppText(chat.phone, t.aiBusy);
      return;
    }
    throw error;
  }

  const said = "text" in input ? input.text : (answer.transcript ?? "(voice note)");
  const allTurns: WhatsAppTurn[] = [
    ...history,
    { role: "user", text: said },
    { role: "assistant", text: answer.reply },
  ];
  const turns = allTurns.slice(-WHATSAPP.maxHistory);
  // The helper repeats the whole draft each turn; keep the last one if it has nothing new
  const draft = answer.draft ?? chat.draft;
  await updateWhatsAppChat(chat.phone, {
    history: turns,
    draft,
    awaitingConfirmation: false,
  });

  const link = answer.link && formUrl(ASSISTANT_PATHS[answer.link]);
  const showLink = link && !["submit_report", "commend_driver"].includes(answer.link ?? "");
  await sendWhatsAppText(chat.phone, answer.reply + (showLink ? `\n${link}` : ""));
  if (isDraftComplete(draft)) await askToConfirm({ ...chat, history: turns, draft }, draft);
};

/** A receipt ID: the report's status, with a button to follow it here. */
const sendStatus = async (phone: string, language: Language, receiptId: string) => {
  const t = messagesFor(language);
  const report = await findReportByReceiptId(receiptId);
  if (!report) {
    await sendWhatsAppText(phone, t.whatsapp.notFound(receiptId));
    return;
  }
  const changedAt = report.statusHistory.at(-1)?.changedAt ?? report.reportedAt;
  const fromTeam = report.messages.filter((message) => message.sender === "admin").length;
  const link = trackingUrl(report.receiptId);
  const text = [
    t.whatsapp.status(report.receiptId, t.statuses[report.status], formatDate(changedAt, language)),
    fromTeam > 0 ? `\n${t.whatsapp.teamMessages(fromTeam)}` : "",
    link ? `\n${link}` : "",
  ].join("");
  if (await isWhatsAppFollowing(report.id, phone)) {
    await sendWhatsAppText(phone, `${text}\n\n${t.whatsapp.alreadyFollowing(report.receiptId)}`);
    return;
  }
  await sendButtons(phone, `${text}\n\n${t.whatsapp.followPrompt}`, [
    { id: `follow:${report.receiptId}`, title: t.whatsapp.buttons.follow },
  ]);
};

const follow = async (phone: string, language: Language, receiptId: string) => {
  const t = messagesFor(language).whatsapp;
  const report = await findReportByReceiptId(receiptId);
  if (!report) {
    await sendWhatsAppText(phone, t.notFound(receiptId));
    return;
  }
  if (await saveWhatsAppSubscription(report.id, phone)) await countEvent("whatsapp_linked");
  await sendWhatsAppText(phone, t.followed(report.receiptId));
};

/** "Send report": files the report the passenger confirmed. */
const sendReport = async (phone: string) => {
  const chat = await claimWhatsAppDraft(phone);
  if (!chat) return; // Already sent, or nothing to send (a second tap)
  const t = messagesFor(chat.language).whatsapp;
  const draft = chat.draft;
  if (!isDraftComplete(draft)) {
    await sendWhatsAppText(phone, t.missing);
    return;
  }

  const uploads = await Promise.allSettled(
    chat.media.map(async (item) => ({ kind: item.kind, url: await uploadToCloudinary(item) })),
  );
  const uploaded = uploads.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  for (const result of uploads) {
    if (result.status === "rejected") {
      console.error(
        "WhatsApp media upload failed:",
        result.reason instanceof Error ? result.reason.message : result.reason,
      );
    }
  }

  let filed;
  try {
    filed = await fileReport(
      {
        type: draft.type,
        category: draft.category ?? "other",
        busNumber: draft.busNumber.toUpperCase(),
        routeNumber: draft.routeNumber,
        location: draft.location || null,
        description: draft.description,
        incidentAt: draft.incidentAt ? new Date(`${draft.incidentAt}:00+05:30`) : null,
        latitude: chat.latitude,
        longitude: chat.longitude,
        images: uploaded.filter((item) => item.kind === "image").map((item) => item.url),
        videos: uploaded.filter((item) => item.kind === "video").map((item) => item.url),
        // Their WhatsApp number: "My reports" finds the report, and updates come back here
        passengerPhone: phone,
        language: chat.language,
        source: "whatsapp",
      },
      { sendSms: false },
    );
  } catch (error) {
    console.error("WhatsApp report failed:", error instanceof Error ? error.message : error);
    await updateWhatsAppChat(phone, { awaitingConfirmation: true });
    await sendWhatsAppText(phone, t.sendFailed);
    return;
  }

  const { saved, pdfUrl } = filed;
  if (await saveWhatsAppSubscription(saved.id, phone)) await countEvent("whatsapp_linked");
  await resetWhatsAppChat(phone);
  const link = trackingUrl(saved.receiptId);
  const failedMedia = uploaded.length < chat.media.length ? `\n\n${t.mediaFailed}` : "";
  await sendWhatsAppText(
    phone,
    t.sent(saved.receiptId) + (link ? t.sentLink(link) : "") + failedMedia,
  );
  if (pdfUrl) {
    await sendDocument(
      phone,
      pdfUrl,
      `BusWatch-${saved.receiptId}.pdf`,
      t.receiptCaption(saved.receiptId),
    ).catch((error: unknown) =>
      console.error("WhatsApp receipt PDF failed:", error instanceof Error ? error.message : error),
    );
  }
};

const handleButton = async (chat: WhatsAppChat, id: string) => {
  const t = messagesFor(chat.language).whatsapp;
  if (id === "draft:send") return sendReport(chat.phone);
  if (id === "draft:change") {
    await updateWhatsAppChat(chat.phone, { awaitingConfirmation: false });
    return sendWhatsAppText(chat.phone, t.changePrompt);
  }
  if (id === "draft:cancel") {
    await resetWhatsAppChat(chat.phone);
    return sendWhatsAppText(chat.phone, t.cancelled);
  }
  if (id.startsWith("follow:")) return follow(chat.phone, chat.language, id.slice(7));
  if (id === "menu:track") return sendWhatsAppText(chat.phone, t.trackPrompt);
  if (id === "menu:report" || id === "menu:commend") {
    if (!isAssistantEnabled()) return sendWelcome(chat.phone, chat.language);
    const prompt = id === "menu:report" ? t.reportPrompt : t.commendPrompt;
    // In the history, so the helper knows what the passenger is answering
    await updateWhatsAppChat(chat.phone, {
      history: [...chat.history, { role: "assistant", text: prompt } satisfies WhatsAppTurn].slice(
        -WHATSAPP.maxHistory,
      ),
    });
    return sendWhatsAppText(chat.phone, prompt);
  }
  return sendWelcome(chat.phone, chat.language);
};

const addMedia = async (chat: WhatsAppChat, kind: "image" | "video", media: MediaPayload) => {
  const t = messagesFor(chat.language).whatsapp;
  const max = kind === "image" ? UPLOAD_LIMITS.maxImages : UPLOAD_LIMITS.maxVideos;
  const updated = await appendWhatsAppMedia(
    chat.phone,
    { id: media.id, kind, mimeType: media.mime_type ?? "" },
    max,
  );
  if (!updated) {
    await sendWhatsAppText(chat.phone, t.mediaFull);
    return;
  }
  const withMedia = { ...chat, media: updated };
  // A caption is said like a typed message; otherwise just confirm
  if (media.caption?.trim()) {
    await converse(withMedia, { text: media.caption.trim() });
    return;
  }
  const { photos, videos } = countMedia(updated);
  await sendWhatsAppText(chat.phone, t.mediaAdded(photos, videos));
  const draft = chat.draft;
  if (chat.awaitingConfirmation && isDraftComplete(draft)) await askToConfirm(withMedia, draft);
};

/** One message from a passenger. */
export const handleWhatsAppMessage = async (message: WhatsAppMessage) => {
  if (!/^\d{8,15}$/.test(message.from)) return;
  const phone = `+${message.from}`;
  let chat = await openWhatsAppChat(phone);
  await countEvent("whatsapp_message");

  const text = message.text?.body.trim() ?? "";
  const language = detectLanguage(text || (message.image?.caption ?? ""), chat.language);
  if (language !== chat.language) {
    await updateWhatsAppChat(phone, { language });
    chat = { ...chat, language };
  }
  const t = messagesFor(language).whatsapp;

  if (!(await recordInbound(phone))) {
    await sendWhatsAppText(phone, t.tooMany);
    return;
  }

  const tapped = buttonId(message);
  if (tapped) return handleButton(chat, tapped);

  switch (message.type) {
    case "text": {
      if (!text) return;
      if (STOP_WORDS.has(text.toUpperCase())) {
        await forgetWhatsAppNumber(phone);
        return sendWhatsAppText(phone, t.stopped);
      }
      const receipt = RECEIPT_ID.exec(text)?.[0];
      // A bare receipt ID (or "track BW-…"): show its status. Inside a longer message the
      // passenger is probably talking about it, so the helper answers.
      if (receipt && text.length <= receipt.length + 12) {
        return sendStatus(phone, language, receipt.toUpperCase());
      }
      if (
        MENU_WORDS.has(text.toUpperCase()) ||
        (GREETINGS.test(text) && chat.history.length === 0)
      ) {
        return sendWelcome(phone, language);
      }
      return converse(chat, { text });
    }
    case "image":
      return message.image ? addMedia(chat, "image", message.image) : undefined;
    case "video":
      return message.video ? addMedia(chat, "video", message.video) : undefined;
    case "audio": {
      if (!message.audio || !isAssistantEnabled()) return sendWhatsAppText(phone, t.unsupported);
      const audio = await downloadMedia(message.audio.id);
      if (audio.data.length > WHATSAPP.maxVoiceBytes)
        return sendWhatsAppText(phone, t.voiceTooLong);
      // WhatsApp voice notes are "audio/ogg; codecs=opus"; Gemini wants the bare type
      return converse(chat, {
        audio: { mimeType: audio.mimeType.split(";")[0] ?? "audio/ogg", data: audio.data },
      });
    }
    case "location": {
      if (!message.location) return;
      const { latitude, longitude, name, address } = message.location;
      await updateWhatsAppChat(phone, { latitude, longitude });
      const draft = chat.draft;
      // A named place fills in "where" if the passenger hadn't said it
      if (draft && !draft.location && (name || address)) {
        const location = [name, address].filter(Boolean).join(", ").slice(0, 200);
        await updateWhatsAppChat(phone, { draft: { ...draft, location } });
      }
      await sendWhatsAppText(phone, t.locationAdded);
      return;
    }
    default:
      return sendWhatsAppText(phone, t.unsupported);
  }
};

// ------------------------------------------------------------------ Notifications

/**
 * Sends a report update to every WhatsApp number following it and returns the numbers reached.
 * Within 24 hours of a number's last message it gets the text itself; after that only the approved
 * template can be sent (when WHATSAPP_UPDATE_TEMPLATE is set), otherwise that number is skipped.
 */
export const sendWhatsAppToReport = async (
  report: { id: string; receiptId: string; language: Language },
  text: string,
  now = Date.now(),
): Promise<string[]> => {
  if (!isWhatsAppConfigured()) return [];
  const phones = await listWhatsAppFollowers(report.id);
  if (phones.length === 0) return [];
  const lastWrote = await lastInboundTimes(phones);
  const results = await Promise.all(
    phones.map(async (phone) => {
      const last = lastWrote.get(phone);
      const inWindow = last && now - last.getTime() < WHATSAPP.replyWindowHours * HOUR_MS;
      try {
        if (inWindow) await sendWhatsAppText(phone, text);
        else if (env.WHATSAPP_UPDATE_TEMPLATE) {
          await sendTemplate(phone, report.language, [report.receiptId, text]);
        } else return null;
        return phone;
      } catch (error) {
        console.error("WhatsApp update failed:", error instanceof Error ? error.message : error);
        return null;
      }
    }),
  );
  return results.filter((phone): phone is string => phone !== null);
};
