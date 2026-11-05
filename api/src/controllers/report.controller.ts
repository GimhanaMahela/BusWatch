import type { Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import {
  RATEABLE_STATUSES,
  REPLY_WINDOW_DAYS,
  type ReportStatus,
  type ReportType,
} from "../config/constants.js";
import type { UploadedMedia } from "../middleware/upload.middleware.js";
import {
  addReportNote,
  createReport,
  deleteReport as deleteReportRow,
  findReportById,
  findReportByReceiptId,
  getReportStats,
  listReports,
  receiptIdExists,
  setOutcomeRating,
  setReportHiddenFromPublic,
  setReportPdfUrl,
  updateReportStatus as updateReportStatusRow,
  type ReportWithRelations,
} from "../repositories/report.repository.js";
import { countEvent } from "../repositories/metric.repository.js";
import { messagesFor } from "../i18n/messages.js";
import { sendReportReceiptEmail, trackingUrl } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";
import { notifyPassenger as deliverToPassenger } from "../services/notification.service.js";
import { generatePdfReceipt } from "../services/pdf-receipt.service.js";
import { generateReceiptId } from "../utils/receipt-id.js";
import { invalidateCache } from "../utils/ttl-cache.js";
import type { VisibilityInput } from "../validators/story.validator.js";
import {
  listReportsQuerySchema,
  type AddNoteInput,
  type RateOutcomeInput,
  type SubmitReportInput,
  type UpdateStatusInput,
} from "../validators/report.validator.js";

type IdParams = { id: string };
type ReceiptParams = { receiptId: string };

const uploadMedia = async (file: Express.Multer.File, resourceType: "image" | "video") => {
  const result = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    { resource_type: resourceType },
  );
  return result.secure_url;
};

const generateFreeReceiptId = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateReceiptId();
    if (!(await receiptIdExists(id))) return id;
  }
  throw new Error("Could not generate a unique receipt ID");
};

export interface PublicTimelineEntry {
  status: ReportStatus;
  note?: string;
  changedAt: Date;
}

const canRate = (type: ReportType, status: ReportStatus) =>
  type === "complaint" && (RATEABLE_STATUSES as readonly ReportStatus[]).includes(status);

const CLOSED_STATUSES: readonly ReportStatus[] = ["resolved", "rejected"];

/** Passengers can reply while a report is open and for a while after it was closed. */
export const canReply = (report: ReportWithRelations, now = Date.now()) => {
  if (!CLOSED_STATUSES.includes(report.status)) return true;
  const closedAt = report.statusHistory.at(-1)?.changedAt ?? report.resolvedAt;
  return !closedAt || now - closedAt.getTime() < REPLY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

/**
 * What a passenger may see about their own report: no media, contact details, internal notes or
 * admin names (messages show "BusWatch team").
 */
export const toPublicView = (report: ReportWithRelations) => {
  const timeline: PublicTimelineEntry[] = report.statusHistory.map(
    ({ status, note, changedAt }) => ({ status, note: note ?? undefined, changedAt }),
  );
  const messages = report.messages.map(({ id, sender, body, createdAt, readAt }) => ({
    id,
    sender,
    body,
    createdAt,
    // For the passenger's own messages: has the team seen it yet?
    read: readAt !== null,
  }));

  return {
    receiptId: report.receiptId,
    type: report.type,
    status: report.status,
    category: report.category,
    busNumber: report.busNumber,
    routeNumber: report.routeNumber,
    location: report.location,
    incidentAt: report.incidentAt,
    reportedAt: report.reportedAt,
    resolvedAt: report.resolvedAt,
    timeline,
    canRate: canRate(report.type, report.status),
    rating: report.outcomeRating,
    feedback: report.outcomeFeedback,
    ratedAt: report.ratedAt,
    messages,
    canReply: canReply(report),
  };
};

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Public
export const submitReport = async (
  req: Request<object, object, SubmitReportInput>,
  res: Response,
) => {
  const { website: _honeypot, busNumber, ...fields } = req.body;
  const files = (req.files ?? {}) as UploadedMedia;

  const receiptId = await generateFreeReceiptId();

  const [images, videos] = await Promise.all([
    Promise.all((files.images ?? []).map((f) => uploadMedia(f, "image"))),
    Promise.all((files.videos ?? []).map((f) => uploadMedia(f, "video"))),
  ]);

  const saved = await createReport(
    { ...fields, busNumber: busNumber.toUpperCase(), images, videos, receiptId },
    fields.type === "commendation" ? "Commendation received." : "Report received.",
  );
  await countEvent(saved.type === "commendation" ? "commendation_submitted" : "report_submitted");

  // Everything below is best-effort: the report is already saved, so a PDF or
  // email failure must not turn into an error response (the passenger would resubmit).
  let pdfBuffer: Buffer | null = null;
  let pdfUrl: string | null = null;
  try {
    ({ pdfBuffer } = await generatePdfReceipt({
      ...saved,
      busName: saved.busName ?? undefined,
      incidentAt: saved.incidentAt ?? undefined,
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
  if (saved.passengerPhone) {
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

  const report = await findReportById(saved.id);
  res.status(201).json({
    msg: "Report submitted successfully!",
    report: report ? toPublicView(report) : null,
    receiptId,
    pdfUrl,
    emailSent,
    smsSent,
  });
};

// @desc    Track a report's status by receipt ID
// @route   GET /api/reports/track/:receiptId
// @access  Public
export const trackReport = async (req: Request<ReceiptParams>, res: Response) => {
  const report = await findReportByReceiptId(req.params.receiptId);
  if (!report) {
    res.status(404).json({ msg: "No report found with this Receipt ID." });
    return;
  }
  res.json(toPublicView(report));
};

// @desc    Rate how a closed report was handled (1–5, optional comment)
// @route   POST /api/reports/track/:receiptId/rating
// @access  Public (the receipt ID is the passenger's key)
export const rateOutcome = async (
  req: Request<ReceiptParams, object, RateOutcomeInput>,
  res: Response,
) => {
  const report = await findReportByReceiptId(req.params.receiptId);
  if (!report) {
    res.status(404).json({ msg: "No report found with this Receipt ID." });
    return;
  }
  if (!canRate(report.type, report.status)) {
    res.status(409).json({ msg: "You can rate the outcome once your report has been closed." });
    return;
  }
  await setOutcomeRating(report.id, req.body.rating, req.body.feedback);
  const updated = await findReportById(report.id);
  if (!updated) throw new Error("Report disappeared while saving a rating");
  res.json(toPublicView(updated));
};

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// @desc    Get reports with filters and pagination (Admin only)
// @route   GET /api/reports?page&limit&status&category&q&from&to
// @access  Private (Admin)
export const getAllReports = async (req: Request, res: Response) => {
  const { page, limit, status, category, type, q, from, to } = listReportsQuerySchema.parse(
    req.query,
  );

  const toDate = parseDate(to);
  // Make "to" inclusive of the whole day when only a date is given
  if (toDate && to && /^\d{4}-\d{2}-\d{2}$/.test(to)) toDate.setUTCHours(23, 59, 59, 999);

  const { rows, total } = await listReports({
    page,
    limit,
    status,
    category,
    type,
    q: q || undefined,
    from: parseDate(from),
    to: toDate,
  });

  res.json({ reports: rows, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
};

// @desc    Dashboard statistics (Admin only)
// @route   GET /api/reports/stats
// @access  Private (Admin)
export const getStats = async (_req: Request, res: Response) => {
  res.json(await getReportStats());
};

// @desc    Get report by ID (Admin only)
// @route   GET /api/reports/:id
// @access  Private (Admin)
export const getReportById = async (req: Request<IdParams>, res: Response) => {
  const report = await findReportById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  res.json(report);
};

// @desc    Get report by Receipt ID (Admin only)
// @route   GET /api/reports/receipt/:receiptId
// @access  Private (Admin)
export const getReportByReceiptId = async (req: Request<ReceiptParams>, res: Response) => {
  const report = await findReportByReceiptId(req.params.receiptId);
  if (!report) {
    res.status(404).json({ msg: "Report not found with this Receipt ID" });
    return;
  }
  res.json(report);
};

// @desc    Update report status, optionally with a message to the passenger (Admin only)
// @route   PUT /api/reports/:id/status
// @access  Private (Admin)
export const updateReportStatus = async (
  req: Request<IdParams, object, UpdateStatusInput>,
  res: Response,
) => {
  const { status, note, notifyPassenger } = req.body;

  const current = await findReportById(req.params.id);
  if (!current) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  if (current.status === status && !note) {
    res.status(400).json({ msg: "Status is unchanged" });
    return;
  }

  await updateReportStatusRow(current.id, { status, note, changedBy: req.admin?.email });
  const report = await findReportById(current.id);
  if (!report) throw new Error("Report disappeared during status update");

  const delivery = notifyPassenger
    ? await deliverToPassenger(report, { kind: "status", status, note })
    : { email: false, sms: false, push: 0, telegram: 0 };

  res.json({ ...report, emailSent: delivery.email, delivery });
};

// @desc    Add an internal note to a report (Admin only)
// @route   POST /api/reports/:id/notes
// @access  Private (Admin)
export const addNote = async (req: Request<IdParams, object, AddNoteInput>, res: Response) => {
  if (!(await addReportNote(req.params.id, req.body.text, req.admin?.email))) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  res.status(201).json(await findReportById(req.params.id));
};

// @desc    Include or exclude a report from public statistics (Admin only)
// @route   PUT /api/reports/:id/visibility
// @access  Private (Admin)
export const setVisibility = async (
  req: Request<IdParams, object, VisibilityInput>,
  res: Response,
) => {
  if (!(await setReportHiddenFromPublic(req.params.id, req.body.hiddenFromPublic))) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  invalidateCache("public:");
  res.json(await findReportById(req.params.id));
};

// @desc    Delete a report (Admin only)
// @route   DELETE /api/reports/:id
// @access  Private (Admin)
export const deleteReport = async (req: Request<IdParams>, res: Response) => {
  const report = await deleteReportRow(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }

  // Clean up Cloudinary files; a failure here should not fail the request
  // (the Cloudinary SDK can also throw synchronously, e.g. when it is not configured)
  const destroy = async (publicId: string, resourceType: "image" | "video" | "raw") => {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (e) {
      console.error(`Failed to delete ${publicId}:`, e instanceof Error ? e.message : e);
    }
  };
  const publicIdFromUrl = (url: string) => url.split("/").pop()?.split(".")[0] ?? "";

  await Promise.all([
    ...report.images.map((url) => destroy(publicIdFromUrl(url), "image")),
    ...report.videos.map((url) => destroy(publicIdFromUrl(url), "video")),
    destroy(`buswatch_receipts/receipt_${report.id}`, "raw"),
  ]);

  res.json({ msg: "Report removed" });
};
