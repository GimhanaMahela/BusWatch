import type { ReportStatus } from "../config/constants.js";
import type { ReportRow } from "../db/schema.js";
import { messagesFor } from "../i18n/messages.js";
import { sendMessageEmail, sendStatusUpdateEmail, trackingUrl } from "./email.service.js";
import { sendPushToReport } from "./push.service.js";
import { sendSms } from "./sms.service.js";
import { sendTelegramToReport } from "./telegram.service.js";

// Tells a passenger something happened on their report, on every channel they gave us:
// email, SMS (or WhatsApp), browser push and Telegram. Each channel is best-effort: the change is already
// saved, so a failed delivery is logged and reported back to the admin, never thrown.

export type PassengerEvent =
  { kind: "status"; status: ReportStatus; note?: string } | { kind: "message"; body: string };

export interface Delivery {
  email: boolean;
  sms: boolean;
  /** Devices reached by browser push */
  push: number;
  /** Telegram chats reached */
  telegram: number;
}

type Recipient = Pick<
  ReportRow,
  "id" | "receiptId" | "type" | "language" | "passengerEmail" | "passengerPhone"
>;

const attempt = async <T>(channel: string, send: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await send();
  } catch (error) {
    console.error(
      `Failed to notify by ${channel}:`,
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
};

const relativeTrackingPath = (receiptId: string, hash = "") =>
  `/track/${encodeURIComponent(receiptId)}${hash}`;

export const notifyPassenger = async (
  report: Recipient,
  event: PassengerEvent,
): Promise<Delivery> => {
  const t = messagesFor(report.language);
  const hash = event.kind === "message" ? "#messages" : "";
  const link = trackingUrl(report.receiptId, hash);
  const statusLabel = event.kind === "status" ? t.statuses[event.status] : "";

  const email = report.passengerEmail
    ? attempt(
        "email",
        () =>
          event.kind === "status"
            ? sendStatusUpdateEmail({
                toEmail: report.passengerEmail ?? "",
                receiptId: report.receiptId,
                status: event.status,
                note: event.note,
                type: report.type,
                language: report.language,
              })
            : sendMessageEmail({
                toEmail: report.passengerEmail ?? "",
                receiptId: report.receiptId,
                body: event.body,
                language: report.language,
              }),
        false,
      )
    : Promise.resolve(false);

  // SMS stays short: what happened and a link, never the message itself (it may be personal)
  const smsText =
    (event.kind === "status"
      ? t.sms.status(report.receiptId, statusLabel)
      : t.sms.message(report.receiptId)) + (link ? t.sms.link(link) : "");
  const sms = report.passengerPhone
    ? attempt("SMS", () => sendSms(report.passengerPhone ?? "", smsText), false)
    : Promise.resolve(false);

  const push = attempt(
    "push",
    () =>
      sendPushToReport(report.id, {
        title: event.kind === "status" ? t.push.statusTitle : t.push.messageTitle,
        body:
          event.kind === "status"
            ? t.push.statusBody(report.receiptId, statusLabel)
            : t.push.messageBody(report.receiptId),
        url: relativeTrackingPath(report.receiptId, hash),
        tag: `report-${report.receiptId}`,
      }),
    0,
  );

  // Telegram gets the same short text as SMS: chats can be read by anyone holding the phone
  const telegram = attempt("Telegram", () => sendTelegramToReport(report.id, smsText), 0);

  const [emailSent, smsSent, pushSent, telegramSent] = await Promise.all([
    email,
    sms,
    push,
    telegram,
  ]);
  return { email: emailSent, sms: smsSent, push: pushSent, telegram: telegramSent };
};
