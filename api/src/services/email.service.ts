import nodemailer from "nodemailer";
import type { ReportStatus } from "../config/constants.js";
import { env, frontendUrl as FRONTEND_URL } from "../config/env.js";

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

/** Emails the PDF receipt. Returns false when email is not configured. */
export const sendReportReceiptEmail = async (
  toEmail: string,
  receiptPdfBuffer: Buffer,
  receiptId: string,
): Promise<boolean> => {
  if (!isEmailConfigured()) {
    console.warn("Email service not configured; skipping receipt email.");
    return false;
  }
  try {
    const mailOptions = {
      from: `BusWatch <${env.EMAIL_SERVICE_USER}>`,
      to: toEmail,
      subject: `Your BusWatch Report Receipt - ID: ${receiptId}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding-bottom: 20px; text-align: center;">
                        <h1 style="color: #0056b3; margin: 0; font-size: 28px;">BusWatch</h1>
                        <p style="color: #555; font-size: 14px; margin-top: 5px;">Your Eye on Public Transport</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hi there!</h2>
                        <p style="font-size: 16px;">Thank you for taking the time to report an issue with public transport. Your vigilance helps us make a real difference!</p>
                        <p style="font-size: 16px;">We've successfully received your report. For your records, please find your official <strong>report receipt attached</strong> to this email.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px; text-align: center;">
                        <div style="background-color: #e0f2f7; padding: 15px; border-radius: 5px; display: inline-block;">
                            <p style="font-size: 18px; font-weight: bold; color: #0056b3; margin: 0;">Your Report ID:</p>
                            <p style="font-size: 24px; font-weight: bold; color: #0056b3; margin: 5px 0 0;">${escapeHtml(receiptId)}</p>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 10px; padding-bottom: 20px; font-size: 15px; color: #555;">
                        <p>This unique ID helps us track and investigate your report efficiently. We truly appreciate your cooperation in contributing to a better public transport system.</p>
                        <p>If you have any further questions or need to refer to this report, please use the Report ID provided above.</p>
                        ${FRONTEND_URL ? `<p><a href="${FRONTEND_URL}/track/${encodeURIComponent(receiptId)}" style="color: #0056b3;">Track the status of your report</a></p>` : ""}
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="font-size: 14px; color: #777;">Sincerely,<br/>The <strong>BusWatch Team</strong></p>
                        <p style="font-size: 12px; color: #999; margin-top: 15px;">&copy; ${new Date().getFullYear()} BusWatch. All rights reserved.</p>
                        ${FRONTEND_URL ? `<p style="font-size: 12px; color: #999;">Visit us at <a href="${FRONTEND_URL}">${FRONTEND_URL}</a></p>` : ""}
                    </td>
                </tr>
            </table>
        </div>
      `,
      attachments: [
        {
          filename: `BusWatch_Report_Receipt_${receiptId}.pdf`,
          content: receiptPdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };
    await transporter.sendMail(mailOptions);
    console.log("Receipt email sent successfully!");
    return true;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    throw error; // The caller decides whether this is fatal
  }
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  escalated: "Escalated to authorities",
  resolved: "Resolved",
  rejected: "Closed without action",
};

/** Tells the passenger their report status changed. Returns false when email is not configured. */
export const sendStatusUpdateEmail = async (
  toEmail: string,
  receiptId: string,
  status: ReportStatus,
  note?: string,
): Promise<boolean> => {
  if (!isEmailConfigured()) {
    console.warn("Email service not configured; skipping status update email.");
    return false;
  }
  const label = STATUS_LABELS[status];
  const trackUrl = FRONTEND_URL ? `${FRONTEND_URL}/track/${encodeURIComponent(receiptId)}` : null;

  await transporter.sendMail({
    from: `BusWatch <${env.EMAIL_SERVICE_USER}>`,
    to: toEmail,
    subject: `Update on your BusWatch report ${receiptId}: ${label}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h1 style="color: #0056b3; margin: 0 0 4px; font-size: 26px; text-align: center;">BusWatch</h1>
        <p style="color: #555; font-size: 14px; margin: 0 0 20px; text-align: center;">Your Eye on Public Transport</p>
        <p style="font-size: 16px;">The status of your report <strong>${escapeHtml(receiptId)}</strong> has changed to:</p>
        <p style="font-size: 22px; font-weight: bold; color: #0056b3; text-align: center; background-color: #e0f2f7; padding: 12px; border-radius: 5px;">${escapeHtml(label)}</p>
        ${note ? `<p style="font-size: 15px;"><strong>Message from the BusWatch team:</strong><br/>${escapeHtml(note).replace(/\n/g, "<br/>")}</p>` : ""}
        ${trackUrl ? `<p style="font-size: 15px; text-align: center;"><a href="${trackUrl}" style="color: #0056b3;">View your report's full timeline</a></p>` : ""}
        <p style="font-size: 14px; color: #777; border-top: 1px solid #eee; padding-top: 16px; text-align: center;">Thank you for helping make public transport safer.<br/>The <strong>BusWatch Team</strong></p>
      </div>
    `,
  });
  return true;
};
