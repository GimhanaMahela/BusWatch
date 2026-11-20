import type { Request, Response } from "express";
import {
  handleWhatsAppWebhook,
  isValidSignature,
  verifySubscription,
  whatsAppReceivesMessages,
  type WhatsAppWebhook,
} from "../services/whatsapp.service.js";

// @desc    Meta's one-off check when the webhook URL is registered in the app dashboard
// @route   GET /api/whatsapp/webhook
// @access  Meta (checked with WHATSAPP_VERIFY_TOKEN)
export const verify = (req: Request, res: Response) => {
  const challenge = whatsAppReceivesMessages() ? verifySubscription(req.query) : null;
  if (challenge === null) {
    res.status(403).json({ msg: "Not authorized" });
    return;
  }
  res.type("text/plain").send(challenge);
};

// @desc    Messages to the TransitX WhatsApp number, delivered by Meta
// @route   POST /api/whatsapp/webhook
// @access  Meta (checked with the X-Hub-Signature-256 header)
export const webhook = async (req: Request, res: Response) => {
  // The body arrives unparsed (see app.ts): the signature is over the exact bytes Meta sent
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!whatsAppReceivesMessages() || !isValidSignature(raw, req.get("x-hub-signature-256"))) {
    res.status(401).json({ msg: "Not authorized" });
    return;
  }
  let payload: WhatsAppWebhook;
  try {
    payload = JSON.parse(raw.toString("utf8")) as WhatsAppWebhook;
  } catch {
    res.status(400).json({ msg: "Invalid JSON" });
    return;
  }
  try {
    await handleWhatsAppWebhook(payload);
  } catch (error) {
    // Still 200: otherwise Meta keeps re-sending the same messages
    console.error("WhatsApp webhook failed:", error instanceof Error ? error.message : error);
  }
  res.json({ ok: true });
};
