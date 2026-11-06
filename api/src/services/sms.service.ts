import { env } from "../config/env.js";

// SMS (or WhatsApp) to passengers who gave a phone number. Three providers:
// - SMS Gateway for Android (free): texts go out from your own Android phone and SIM, so they
//   only cost your normal SMS package. https://docs.sms-gate.app/
// - Notify.lk, a Sri Lankan gateway: https://developer.notify.lk/api-endpoints/
// - Twilio: SMS, or WhatsApp when TWILIO_FROM is "whatsapp:+…" (WhatsApp needs approved
//   message templates for messages the passenger did not start; see the README)
// SMS_PROVIDER=none (the default) sends nothing.

const TIMEOUT_MS = 10_000;

export const isSmsConfigured = (): boolean => {
  switch (env.SMS_PROVIDER) {
    case "android":
      return Boolean(env.ANDROID_SMS_USERNAME && env.ANDROID_SMS_PASSWORD);
    case "notifylk":
      return Boolean(env.NOTIFYLK_USER_ID && env.NOTIFYLK_API_KEY && env.NOTIFYLK_SENDER_ID);
    case "twilio":
      return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM);
    default:
      return false;
  }
};

// Sinhala and Tamil need Unicode SMS (shorter segments, so they cost more per character)
const needsUnicode = (text: string) => [...text].some((char) => char.charCodeAt(0) > 0x7f);

// The phone splits long texts itself. Same API in cloud mode (api.sms-gate.app) and local mode
// (the app's own server at http://<phone-ip>:8080, when the API and phone share a network).
const sendAndroid = async (to: string, message: string) => {
  const base = env.ANDROID_SMS_URL.replace(/\/$/, "");
  const credentials = `${env.ANDROID_SMS_USERNAME ?? ""}:${env.ANDROID_SMS_PASSWORD ?? ""}`;
  const response = await fetch(`${base}/message`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ textMessage: { text: message }, phoneNumbers: [to] }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(
      `The Android SMS gateway refused the SMS: ${result.message ?? `HTTP ${response.status}`}`,
    );
  }
};

const sendNotifyLk = async (to: string, message: string) => {
  const body = new URLSearchParams({
    user_id: env.NOTIFYLK_USER_ID ?? "",
    api_key: env.NOTIFYLK_API_KEY ?? "",
    sender_id: env.NOTIFYLK_SENDER_ID ?? "",
    to: to.replace(/^\+/, ""), // Notify.lk wants 9471XXXXXXX
    message,
  });
  if (needsUnicode(message)) body.set("type", "unicode");
  const response = await fetch("https://app.notify.lk/api/v1/send", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const result = (await response.json().catch(() => ({}))) as { status?: string };
  if (!response.ok || result.status !== "success") {
    throw new Error(`Notify.lk refused the SMS (HTTP ${response.status})`);
  }
};

const sendTwilio = async (to: string, message: string) => {
  const sid = env.TWILIO_ACCOUNT_SID ?? "";
  const from = env.TWILIO_FROM ?? "";
  const whatsapp = from.startsWith("whatsapp:");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN ?? ""}`).toString("base64")}`,
    },
    body: new URLSearchParams({ To: whatsapp ? `whatsapp:${to}` : to, From: from, Body: message }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Twilio refused the message: ${result.message ?? `HTTP ${response.status}`}`);
  }
};

/**
 * Sends a text to an E.164 number. Returns false when SMS is not configured (in development the
 * text is printed instead, so sign-in codes can be tested); throws when the provider fails.
 */
export const sendSms = async (to: string, message: string): Promise<boolean> => {
  if (!isSmsConfigured()) {
    if (env.NODE_ENV === "development") console.info(`[sms disabled] to ${to}: ${message}`);
    return false;
  }
  if (env.SMS_PROVIDER === "android") await sendAndroid(to, message);
  else if (env.SMS_PROVIDER === "notifylk") await sendNotifyLk(to, message);
  else await sendTwilio(to, message);
  return true;
};
