import type { Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import type { ReportStatus } from "../config/constants.js";
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
  setReportPdfUrl,
  updateReportStatus as updateReportStatusRow,
  type ReportWithRelations,
} from "../repositories/report.repository.js";
import { sendReportReceiptEmail, sendStatusUpdateEmail } from "../services/email.service.js";
import { generatePdfReceipt } from "../services/pdf-receipt.service.js";
import { generateReceiptId } from "../utils/receipt-id.js";
import {
  listReportsQuerySchema,
  type AddNoteInput,
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

/** What a passenger may see about their own report: no media, email or internal notes. */
const toPublicView = (report: ReportWithRelations) => {
  const timeline: PublicTimelineEntry[] = report.statusHistory.map(
    ({ status, note, changedAt }) => ({ status, note: note ?? undefined, changedAt }),
  );

  return {
    receiptId: report.receiptId,
    status: report.status,
    category: report.category,
    busNumber: report.busNumber,
    routeNumber: report.routeNumber,
    location: report.location,
    incidentAt: report.incidentAt,
    reportedAt: report.reportedAt,
    resolvedAt: report.resolvedAt,
    timeline,
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
    "Report received.",
  );

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
      emailSent = await sendReportReceiptEmail(saved.passengerEmail, pdfBuffer, receiptId);
    } catch (emailError) {
      console.error(
        "Failed to send receipt email:",
        emailError instanceof Error ? emailError.message : emailError,
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

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// @desc    Get reports with filters and pagination (Admin only)
// @route   GET /api/reports?page&limit&status&category&q&from&to
// @access  Private (Admin)
export const getAllReports = async (req: Request, res: Response) => {
  const { page, limit, status, category, q, from, to } = listReportsQuerySchema.parse(req.query);

  const toDate = parseDate(to);
  // Make "to" inclusive of the whole day when only a date is given
  if (toDate && to && /^\d{4}-\d{2}-\d{2}$/.test(to)) toDate.setUTCHours(23, 59, 59, 999);

  const { rows, total } = await listReports({
    page,
    limit,
    status,
    category,
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

  let emailSent = false;
  if (notifyPassenger && report.passengerEmail) {
    try {
      emailSent = await sendStatusUpdateEmail(
        report.passengerEmail,
        report.receiptId,
        status,
        note,
      );
    } catch (emailError) {
      console.error(
        "Failed to send status update email:",
        emailError instanceof Error ? emailError.message : emailError,
      );
    }
  }

  res.json({ ...report, emailSent });
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
