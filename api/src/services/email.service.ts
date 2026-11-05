import nodemailer from "nodemailer";
import {
  RATEABLE_STATUSES,
  type Language,
  type ReportStatus,
  type ReportType,
} from "../config/constants.js";
import { env, frontendUrl as FRONTEND_URL } from "../config/env.js";
import { messagesFor } from "../i18n/messages.js";

const isEmailConfigured = (): boolean => Boolean(env.EMAIL_SERVICE_HOST && env.EMAIL_SERVICE_USER);

const transporter = nodemailer.createTransport({
  host: env.EMAIL_SERVICE_HOST,
  port: env.EMAIL_SERVICE_PORT,
  secure: false, // STARTTLS on port 587
  auth: {
    user: env.EMAIL_SERVICE_USER,
    pass: env.EMAIL_SERVICE_PASS,
  },
  tls: {
    // Only relax certificate checks when explicitly asked (e.g. Ethereal in development)
    rejectUnauthorized: !env.EMAIL_ALLOW_SELF_SIGNED,
  },
});

const escapeHtml = (value = ""): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Public tracking page for a receipt, or null when FRONTEND_URL is not configured. */
export const trackingUrl = (receiptId: string, hash = "") =>
  FRONTEND_URL ? `${FRONTEND_URL}/track/${encodeURIComponent(receiptId)}${hash}` : null;

const FONT_STACK =
  "'Helvetica Neue', Helvetica, Arial, 'Noto Sans Sinhala', 'Iskoola Pota', 'Noto Sans Tamil', 'Latha', sans-serif";

/** Shared wrapper: brand header, content, sign-off. `lang` sets the HTML language for mail clients. */
const layout = (lang: Language, content: string) => {
  const t = messagesFor(lang);
  return `
    <div lang="${lang}" style="font-family: ${FONT_STACK}; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h1 style="color: #0056b3; margin: 0 0 4px; font-size: 26px; text-align: center;">BusWatch</h1>
      <p style="color: #555; font-size: 14px; margin: 0 0 20px; text-align: center;">${escapeHtml(t.tagline)}</p>
      ${content}
      <div style="font-size: 14px; color: #777; border-top: 1px solid #eee; padding-top: 16px; margin-top: 20px; text-align: center;">
        <p style="margin: 0;">${escapeHtml(t.receiptEmail.signOff)}<br/><strong>${escapeHtml(t.receiptEmail.team)}</strong></p>
        <p style="font-size: 12px; color: #999; margin-top: 15px;">&copy; ${new Date().getFullYear()} BusWatch.</p>
        ${FRONTEND_URL ? `<p style="font-size: 12px; color: #999;">${escapeHtml(t.receiptEmail.visit)} <a href="${FRONTEND_URL}">${FRONTEND_URL}</a></p>` : ""}
      </div>
    </div>
  `;
};

export interface ReceiptEmailInput {
  toEmail: string;
  receiptPdfBuffer: Buffer;
  receiptId: string;
  type?: ReportType;
  language?: Language;
}

/** Emails the PDF receipt in the passenger's language. Returns false when email is not configured. */
export const sendReportReceiptEmail = async ({
  toEmail,
  receiptPdfBuffer,
  receiptId,
  type = "complaint",
  language = "en",
}: ReceiptEmailInput): Promise<boolean> => {
  if (!isEmailConfigured()) {
    console.warn("Email service not configured; skipping receipt email.");
    return false;
  }
  const t = messagesFor(language).receiptEmail;
  const trackUrl = trackingUrl(receiptId);

  try {
    await transporter.sendMail({
      from: `BusWatch <${env.EMAIL_SERVICE_USER}>`,
      to: toEmail,
      subject: t.subject(receiptId, type),
      html: layout(
        language,
        `
        <h2 style="font-size: 20px; color: #333; margin-top: 0;">${escapeHtml(t.greeting)}</h2>
        <p style="font-size: 16px;">${escapeHtml(t.thanks[type])}</p>
        <p style="font-size: 16px;">${t.received}</p>
        <div style="text-align: center; margin: 20px 0;">
          <div style="background-color: #e0f2f7; padding: 15px; border-radius: 5px; display: inline-block;">
            <p style="font-size: 18px; font-weight: bold; color: #0056b3; margin: 0;">${escapeHtml(t.idLabel)}</p>
            <p style="font-size: 24px; font-weight: bold; color: #0056b3; margin: 5px 0 0;">${escapeHtml(receiptId)}</p>
          </div>
        </div>
        <p style="font-size: 15px; color: #555;">${escapeHtml(t.idHelp)}</p>
        ${trackUrl ? `<p style="font-size: 15px;"><a href="${trackUrl}" style="color: #0056b3;">${escapeHtml(t.trackLink)}</a></p>` : ""}
      `,
      ),
      attachments: [
        {
          filename: `BusWatch_Report_Receipt_${receiptId}.pdf`,
          content: receiptPdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    console.log("Receipt email sent successfully!");
    return true;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    throw error; // The caller decides whether this is fatal
  }
};

export interface StatusEmailInput {
  toEmail: string;
  receiptId: string;
  status: ReportStatus;
  note?: string;
  type?: ReportType;
  language?: Language;
}

/**
 * Tells the passenger their report status changed, in their language. When a complaint is closed
 * the email also asks them to rate the outcome. Returns false when email is not configured.
 */
export const sendStatusUpdateEmail = async ({
  toEmail,
  receiptId,
  status,
  note,
  type = "complaint",
  language = "en",
}: StatusEmailInput): Promise<boolean> => {
  if (!isEmailConfigured()) {
    console.warn("Email service not configured; skipping status update email.");
    return false;
  }
  const messages = messagesFor(language);
  const t = messages.statusEmail;
  const label = messages.statuses[status];
  const trackUrl = trackingUrl(receiptId);
  const rateUrl =
    type === "complaint" && (RATEABLE_STATUSES as readonly ReportStatus[]).includes(status)
      ? trackingUrl(receiptId, "#rate")
      : null;

  await transporter.sendMail({
    from: `BusWatch <${env.EMAIL_SERVICE_USER}>`,
    to: toEmail,
    subject: t.subject(receiptId, label),
    html: layout(
      language,
      `
      <p style="font-size: 16px;">${t.changedTo(escapeHtml(receiptId))}</p>
      <p style="font-size: 22px; font-weight: bold; color: #0056b3; text-align: center; background-color: #e0f2f7; padding: 12px; border-radius: 5px;">${escapeHtml(label)}</p>
      ${note ? `<p style="font-size: 15px;"><strong>${escapeHtml(t.teamMessage)}</strong><br/>${escapeHtml(note).replace(/\n/g, "<br/>")}</p>` : ""}
      ${
        rateUrl
          ? `<div style="text-align: center; margin: 24px 0; padding: 16px; border-radius: 8px; background-color: #fff7e0;">
               <p style="font-size: 16px; font-weight: bold; margin: 0 0 8px;">${escapeHtml(t.ratePrompt)}</p>
               <p style="font-size: 26px; letter-spacing: 4px; margin: 0 0 8px; color: #E8A10C;">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
               <a href="${rateUrl}" style="display: inline-block; background-color: #0056b3; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold;">${escapeHtml(t.rateLink)}</a>
             </div>`
          : ""
      }
      ${trackUrl ? `<p style="font-size: 15px; text-align: center;"><a href="${trackUrl}" style="color: #0056b3;">${escapeHtml(t.timelineLink)}</a></p>` : ""}
      <p style="font-size: 14px; color: #777; text-align: center;">${escapeHtml(t.thanks)}</p>
    `,
    ),
  });
  return true;
};
