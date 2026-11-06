import type { Request, Response } from "express";
import { findReportByReceiptId } from "../repositories/report.repository.js";
import {
  handleTelegramUpdate,
  isTelegramConfigured,
  isValidWebhookSecret,
  telegramFollowUrl,
  telegramUsesWebhook,
  type TelegramUpdate,
} from "../services/telegram.service.js";

// @desc    A t.me link that makes the passenger's Telegram chat follow the report
// @route   GET /api/reports/track/:receiptId/telegram
// @access  Public (the receipt ID is the passenger's key)
export const followLink = async (req: Request<{ receiptId: string }>, res: Response) => {
  if (!isTelegramConfigured()) {
    res
      .status(503)
      .json({ msg: "Telegram updates are not available yet.", code: "telegram_unavailable" });
    return;
  }
  const report = await findReportByReceiptId(req.params.receiptId);
  if (!report) {
    res.status(404).json({ msg: "No report found with this Receipt ID." });
    return;
  }
  try {
    res.json({ url: await telegramFollowUrl(report.receiptId) });
  } catch (error) {
    console.error("Telegram link failed:", error instanceof Error ? error.message : error);
    res
      .status(503)
      .json({ msg: "Telegram updates are not available yet.", code: "telegram_unavailable" });
  }
};

// @desc    Messages to the BusWatch bot, delivered by Telegram (hosted setups only)
// @route   POST /api/telegram/webhook
// @access  Telegram (checked with the secret header)
export const webhook = async (req: Request<object, object, TelegramUpdate>, res: Response) => {
  if (!telegramUsesWebhook() || !isValidWebhookSecret(req.get("x-telegram-bot-api-secret-token"))) {
    res.status(401).json({ msg: "Not authorized" });
    return;
  }
  try {
    await handleTelegramUpdate(req.body);
  } catch (error) {
    // Still 200: otherwise Telegram keeps re-sending the same message
    console.error("Telegram update failed:", error instanceof Error ? error.message : error);
  }
  res.json({ ok: true });
};
