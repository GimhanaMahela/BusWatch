import cloudinary from "../config/cloudinary.js";
import type { MetricEvent, ReportType } from "../config/constants.js";
import { env } from "../config/env.js";
import { analyseInBackground } from "../controllers/ai.controller.js";
import type { NewReportRow, ReportRow } from "../db/schema.js";
import { messagesFor } from "../i18n/messages.js";
import { countEvent } from "../repositories/metric.repository.js";
import {
  createReport,
  receiptIdExists,
  setReportPdfUrl,
} from "../repositories/report.repository.js";
import { generateReceiptId } from "../utils/receipt-id.js";
import { sendReportReceiptEmail, trackingUrl } from "./email.service.js";
import { generatePdfReceipt } from "./pdf-receipt.service.js";
import { sendSms } from "./sms.service.js";

// Saving a new report and everything that follows (PDF receipt, receipt email and SMS). Shared by
// the website form and the WhatsApp bot.

const FIRST_NOTE: Record<ReportType, string> = {
  complaint: "Report received.",
  commendation: "Commendation received.",
  lost_item: "Lost item report received. We've passed it on to the bus operator where we can.",
  road_incident: "Road incident report received.",
};

const SUBMITTED_EVENT: Record<ReportType, MetricEvent> = {
  complaint: "report_submitted",
  commendation: "commendation_submitted",
  lost_item: "lost_item_submitted",
  road_incident: "road_incident_submitted",
};

export const generateFreeReceiptId = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateReceiptId();
    if (!(await receiptIdExists(id))) return id;
  }
  throw new Error("Could not generate a unique receipt ID");
};

export interface FiledReport {
  saved: ReportRow;
  pdfUrl: string | null;
  emailSent: boolean;
  smsSent: boolean;
}

/**
 * Saves the report, then makes the PDF receipt and sends the receipt email and SMS. Only the save
 * can fail: the rest is best-effort, because a failure there must not make the passenger send the
 * report again. `sendSms: false` skips the receipt SMS (the WhatsApp bot answers in the chat).
 */
export const fileReport = async (
  values: Omit<NewReportRow, "receiptId"> & { receiptId?: string },
  options: { sendSms?: boolean } = {},
): Promise<FiledReport> => {
  const receiptId = values.receiptId ?? (await generateFreeReceiptId());
  const saved = await createReport(
    { ...values, receiptId },
    FIRST_NOTE[values.type ?? "complaint"],
  );
  await countEvent(SUBMITTED_EVENT[saved.type]);
  if (saved.details?.safety) await countEvent("safety_report_submitted");
  if (env.AI_AUTO_ANALYSE) analyseInBackground(saved);

  let pdfBuffer: Buffer | null = null;
  let pdfUrl: string | null = null;
  try {
    ({ pdfBuffer } = await generatePdfReceipt({
      ...saved,
      busName: saved.busName ?? undefined,
      incidentAt: saved.incidentAt ?? undefined,
      details: saved.details,
    }));
    const pdfUploadResult = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
      { resource_type: "raw", folder: "buswatch_receipts", public_id: `receipt_${saved.id}` },
    );
    pdfUrl = pdfUploadResult.secure_url;
    await setReportPdfUrl(saved.id, pdfUrl);
  } catch (pdfError) {
    console.error(
      "Failed to generate or upload PDF receipt:",
      pdfError instanceof Error ? pdfError.message : pdfError,
    );
  }

  let emailSent = false;
  if (saved.passengerEmail && pdfBuffer) {
    try {
      emailSent = await sendReportReceiptEmail({
        toEmail: saved.passengerEmail,
        receiptPdfBuffer: pdfBuffer,
        receiptId,
        type: saved.type,
        language: saved.language,
      });
    } catch (emailError) {
      console.error(
        "Failed to send receipt email:",
        emailError instanceof Error ? emailError.message : emailError,
      );
    }
  }

  let smsSent = false;
  if (saved.passengerPhone && options.sendSms !== false) {
    const link = trackingUrl(receiptId);
    const t = messagesFor(saved.language).sms;
    try {
      smsSent = await sendSms(
        saved.passengerPhone,
        t.received(receiptId) + (link ? t.link(link) : ""),
      );
    } catch (smsError) {
      console.error(
        "Failed to send receipt SMS:",
        smsError instanceof Error ? smsError.message : smsError,
      );
    }
  }

  return { saved: { ...saved, pdfUrl }, pdfUrl, emailSent, smsSent };
};
