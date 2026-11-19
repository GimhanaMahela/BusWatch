import { createHmac, timingSafeEqual } from "node:crypto";
import { LANGUAGES, type Language } from "../config/constants.js";
import { env, frontendUrl } from "../config/env.js";
import { messagesFor } from "../i18n/messages.js";
import { countEvent } from "../repositories/metric.repository.js";
import { findReportByReceiptId } from "../repositories/report.repository.js";
import {
  deleteTelegramChat,
  listTelegramChats,
  saveTelegramSubscription,
} from "../repositories/telegram.repository.js";

// Free report updates on Telegram through a BusWatch bot (https://core.telegram.org/bots/api).
// The tracking page links to t.me/<bot>?start=<token>; pressing Start sends us "/start <token>"
// and that chat then follows the report. "/stop" unfollows everything.
//
// Telegram hands us new messages in one of two ways:
// - long polling (default): the API keeps asking Telegram, so it works on localhost
// - a webhook (TELEGRAM_WEBHOOK_SECRET set): Telegram calls FRONTEND_URL/api/telegram/webhook,
//   for hosts that can't keep a loop running (serverless)

const TIMEOUT_MS = 10_000;
const POLL_SECONDS = 25;
/** Follow links work for a day; the tracking page makes a new one on each tap. */
const LINK_TTL_SECONDS = 24 * 60 * 60;

export const isTelegramConfigured = (): boolean => Boolean(env.TELEGRAM_BOT_TOKEN);
export const telegramUsesWebhook = (): boolean => Boolean(env.TELEGRAM_WEBHOOK_SECRET);

export class TelegramError extends Error {
  constructor(
    readonly code: number,
    description: string,
  ) {
    super(`Telegram error ${code}: ${description}`);
    this.name = "TelegramError";
  }
}

const callTelegram = async <T>(method: string, body: object, timeoutMs = TIMEOUT_MS) => {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const result = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    result?: T;
    error_code?: number;
    description?: string;
  };
  if (!result.ok) {
    throw new TelegramError(result.error_code ?? response.status, result.description ?? "unknown");
  }
  return result.result as T;
};

const sendMessage = (chatId: string, text: string) =>
  callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    link_preview_options: { is_disabled: true },
  });

// ------------------------------------------------------------------ Follow links

let botUsername: string | null = null;
const getBotUsername = async () => {
  botUsername ??= (await callTelegram<{ username: string }>("getMe", {})).username;
  return botUsername;
};

const sign = (payload: string) =>
  createHmac("sha256", env.JWT_SECRET)
    .update(`telegram:${payload}`)
    .digest("base64url")
    .slice(0, 16);

/** Start parameters allow 64 characters of A-Z, a-z, 0-9, _ and -: "BW-2026-7KQ4MZ_<expiry>_<sig>". */
export const createFollowToken = (receiptId: string, now = Date.now()) => {
  const payload = `${receiptId}_${Math.floor(now / 1000 + LINK_TTL_SECONDS).toString(36)}`;
  return `${payload}_${sign(payload)}`;
};

/** The receipt ID inside a valid, unexpired token, or null. */
export const readFollowToken = (token: string, now = Date.now()) => {
  const match = /^([A-Za-z0-9-]{1,30})_([a-z0-9]{1,10})_([\w-]{16})$/.exec(token);
  if (!match) return null;
  const [, receiptId = "", expiry = "", signature = ""] = match;
  const expected = Buffer.from(sign(`${receiptId}_${expiry}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (parseInt(expiry, 36) * 1000 < now) return null;
  return receiptId;
};

export const telegramFollowUrl = async (receiptId: string) =>
  `https://t.me/${await getBotUsername()}?start=${createFollowToken(receiptId)}`;

// ------------------------------------------------------------------ Incoming messages

export interface TelegramUpdate {
  update_id: number;
  message?: {
    text?: string;
    chat: { id: number; type: string };
    from?: { language_code?: string };
  };
}

const languageOf = (code?: string): Language =>
  LANGUAGES.find((language) => language === code?.slice(0, 2)) ?? "en";

export const handleTelegramUpdate = async (update: TelegramUpdate) => {
  const message = update.message;
  // Only private chats: a group would share one passenger's updates with everyone in it
  if (!message?.text || message.chat.type !== "private") return;
  const chatId = String(message.chat.id);
  const [command = "", argument = ""] = message.text.trim().split(/\s+/, 2);
  const name = (command.split("@")[0] ?? "").toLowerCase();

  if (name === "/stop") {
    await deleteTelegramChat(chatId);
    await sendMessage(
      chatId,
      messagesFor(languageOf(message.from?.language_code)).telegram.stopped,
    );
    return;
  }

  if (name === "/start" && argument) {
    const receiptId = readFollowToken(argument);
    const report = receiptId ? await findReportByReceiptId(receiptId) : null;
    if (!report) {
      await sendMessage(
        chatId,
        messagesFor(languageOf(message.from?.language_code)).telegram.invalidLink,
      );
      return;
    }
    if (await saveTelegramSubscription(report.id, chatId)) await countEvent("telegram_linked");
    const t = messagesFor(report.language);
    const link = frontendUrl
      ? `\n${frontendUrl}/track/${encodeURIComponent(report.receiptId)}`
      : "";
    await sendMessage(chatId, t.telegram.linked(report.receiptId) + link);
    return;
  }

  await sendMessage(chatId, messagesFor(languageOf(message.from?.language_code)).telegram.welcome);
};

// ------------------------------------------------------------------ Notifications

/**
 * Sends a text to every chat following a report and returns how many it reached. Chats that
 * blocked the bot or were deleted are forgotten; other failures are logged.
 */
export const sendTelegramToReport = async (reportId: string, text: string) => {
  if (!isTelegramConfigured()) return 0;
  const chats = await listTelegramChats(reportId);
  const results = await Promise.all(
    chats.map(async (chatId) => {
      try {
        await sendMessage(chatId, text);
        return true;
      } catch (error) {
        // 403: the passenger blocked the bot; 400 "chat not found": the chat was deleted
        if (
          error instanceof TelegramError &&
          (error.code === 403 || (error.code === 400 && /chat not found/i.test(error.message)))
        ) {
          await deleteTelegramChat(chatId);
        } else {
          console.error("Telegram message failed:", error instanceof Error ? error.message : error);
        }
        return false;
      }
    }),
  );
  return results.filter(Boolean).length;
};

// ------------------------------------------------------------------ Receiving updates

/** Constant-time check of the secret Telegram sends with every webhook call. */
export const isValidWebhookSecret = (header: unknown) => {
  const secret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || typeof header !== "string") return false;
  const expected = Buffer.from(secret);
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const poll = async () => {
  // A webhook left over from a hosted setup would make polling fail with 409
  await callTelegram("deleteWebhook", {});
  let offset = 0;
  for (;;) {
    try {
      const updates = await callTelegram<TelegramUpdate[]>(
        "getUpdates",
        { offset, timeout: POLL_SECONDS, allowed_updates: ["message"] },
        (POLL_SECONDS + 10) * 1000,
      );
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleTelegramUpdate(update).catch((error: unknown) =>
          console.error("Telegram update failed:", error instanceof Error ? error.message : error),
        );
      }
    } catch (error) {
      console.error("Telegram polling failed:", error instanceof Error ? error.message : error);
      await pause(5_000);
    }
  }
};

/** Starts receiving bot messages: registers the webhook, or starts long polling. */
export const startTelegramBot = async () => {
  if (!isTelegramConfigured()) return;
  const username = await getBotUsername();
  if (telegramUsesWebhook()) {
    if (!frontendUrl) throw new Error("TELEGRAM_WEBHOOK_SECRET needs FRONTEND_URL");
    await callTelegram("setWebhook", {
      url: `${frontendUrl}/api/telegram/webhook`,
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ["message"],
    });
    console.log(`Telegram bot @${username} is receiving messages by webhook`);
    return;
  }
  console.log(`Telegram bot @${username} is receiving messages (long polling)`);
  void poll();
};
