import type { Request, Response } from "express";
import type { QueryFilter } from "mongoose";
import cloudinary from "../config/cloudinary.js";
import {
  OPEN_STATUSES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportStatus,
} from "../config/constants.js";
import type { UploadedMedia } from "../middleware/upload.middleware.js";
import { ReportModel, type Report, type ReportDocument } from "../models/report.model.js";
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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Receipt IDs are upper-case (BW-2026-XXXXXX); older reports use lower-case UUIDs
const findByReceiptId = (rawId: string) => {
  const id = rawId.trim();
  return ReportModel.findOne({ receiptId: { $in: [id, id.toUpperCase(), id.toLowerCase()] } });
};

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
    if (!(await ReportModel.exists({ receiptId: id }))) return id;
  }
  throw new Error("Could not generate a unique receipt ID");
};

export interface PublicTimelineEntry {
  status: ReportStatus;
  note?: string;
  changedAt: Date | null;
}

/** What a passenger may see about their own report: no media, email or internal notes. */
const toPublicView = (report: ReportDocument) => {
  const timeline: PublicTimelineEntry[] =
    report.statusHistory.length > 0
      ? report.statusHistory.map(({ status, note, changedAt }) => ({ status, note, changedAt }))
      : [{ status: "pending", changedAt: report.reportedAt }];

  // Reports created before status history existed only know their current status
  if (timeline.at(-1)?.status !== report.status) {
    timeline.push({ status: report.status, changedAt: null });
  }

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
  const { latitude, longitude, incidentAt, website: _honeypot, ...fields } = req.body;
  const files = (req.files ?? {}) as UploadedMedia;

  const receiptId = await generateFreeReceiptId();

  const [images, videos] = await Promise.all([
    Promise.all((files.images ?? []).map((f) => uploadMedia(f, "image"))),
    Promise.all((files.videos ?? []).map((f) => uploadMedia(f, "video"))),
  ]);

  const report = await ReportModel.create({
    ...fields,
    coordinates:
      latitude !== undefined && longitude !== undefined
        ? { type: "Point", coordinates: [longitude, latitude] }
        : undefined,
    incidentAt,
    images,
    videos,
    receiptId,
    statusHistory: [{ status: "pending", note: "Report received." }],
  });

  // Everything below is best-effort: the report is already saved, so a PDF or
  // email failure must not turn into an error response (the passenger would resubmit).
  let pdfBuffer: Buffer | null = null;
  try {
    ({ pdfBuffer } = await generatePdfReceipt(report.toObject()));
    const pdfUploadResult = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
      { resource_type: "raw", folder: "buswatch_receipts", public_id: `receipt_${report.id}` },
    );
    report.pdfUrl = pdfUploadResult.secure_url;
    await report.save();
  } catch (pdfError) {
    console.error(
      "Failed to generate or upload PDF receipt:",
      pdfError instanceof Error ? pdfError.message : pdfError,
    );
  }

  let emailSent = false;
  if (report.passengerEmail && pdfBuffer) {
    try {
      emailSent = await sendReportReceiptEmail(report.passengerEmail, pdfBuffer, receiptId);
    } catch (emailError) {
      console.error(
        "Failed to send receipt email:",
        emailError instanceof Error ? emailError.message : emailError,
      );
    }
  }

  res.status(201).json({
    msg: "Report submitted successfully!",
    report: toPublicView(report),
    receiptId,
    pdfUrl: report.pdfUrl ?? null,
    emailSent,
  });
};

// @desc    Track a report's status by receipt ID
// @route   GET /api/reports/track/:receiptId
// @access  Public
export const trackReport = async (req: Request<ReceiptParams>, res: Response) => {
  const report = await findByReceiptId(req.params.receiptId);
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

  const filter: QueryFilter<Report> = {};
  if (status === "open") filter.status = { $in: [...OPEN_STATUSES] };
  else if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { receiptId: re },
      { busNumber: re },
      { routeNumber: re },
      { busName: re },
      { location: re },
    ];
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (fromDate || toDate) {
    // Make "to" inclusive of the whole day when only a date is given
    if (toDate && to && /^\d{4}-\d{2}-\d{2}$/.test(to)) toDate.setUTCHours(23, 59, 59, 999);
    filter.reportedAt = {
      ...(fromDate && { $gte: fromDate }),
      ...(toDate && { $lte: toDate }),
    };
  }

  const [reports, total] = await Promise.all([
    ReportModel.find(filter)
      .select("-notes -statusHistory")
      .sort({ reportedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ReportModel.countDocuments(filter),
  ]);

  res.json({ reports, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
};

interface CountBucket<K = string> {
  _id: K;
  count: number;
}

interface StatsFacets {
  total: { count: number }[];
  last30Days: { count: number }[];
  byStatus: CountBucket<ReportStatus>[];
  byCategory: CountBucket<ReportCategory>[];
  byMonth: CountBucket[];
  topRoutes: CountBucket[];
  topBuses: (CountBucket & { busName?: string })[];
  repeatOffenders: (CountBucket & { lastReportedAt: Date })[];
  resolution: { avgMs: number; count: number }[];
}

// @desc    Dashboard statistics (Admin only)
// @route   GET /api/reports/stats
// @access  Private (Admin)
export const getStats = async (_req: Request, res: Response) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [result] = await ReportModel.aggregate<StatsFacets>([
    {
      $facet: {
        total: [{ $count: "count" }],
        last30Days: [{ $match: { reportedAt: { $gte: thirtyDaysAgo } } }, { $count: "count" }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byCategory: [
          { $group: { _id: { $ifNull: ["$category", "other"] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byMonth: [
          { $match: { reportedAt: { $gte: twelveMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$reportedAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        topRoutes: [
          { $group: { _id: "$routeNumber", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        topBuses: [
          {
            $group: {
              _id: { $toUpper: "$busNumber" },
              count: { $sum: 1 },
              busName: { $last: "$busName" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        repeatOffenders: [
          { $match: { reportedAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $toUpper: "$busNumber" },
              count: { $sum: 1 },
              lastReportedAt: { $max: "$reportedAt" },
            },
          },
          { $match: { count: { $gte: 3 } } },
          { $sort: { count: -1 } },
        ],
        resolution: [
          { $match: { status: "resolved", resolvedAt: { $ne: null } } },
          {
            $group: {
              _id: null,
              avgMs: { $avg: { $subtract: ["$resolvedAt", "$reportedAt"] } },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  if (!result) throw new Error("Stats aggregation returned no result");

  // Fill in empty months so the trend has no gaps
  const monthCounts = new Map(result.byMonth.map((m) => [m._id, m.count]));
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { month: key, count: monthCounts.get(key) ?? 0 };
  });

  const byStatus = Object.fromEntries(REPORT_STATUSES.map((s) => [s, 0])) as Record<
    ReportStatus,
    number
  >;
  for (const { _id, count } of result.byStatus) byStatus[_id] = count;

  const resolution = result.resolution[0];
  res.json({
    total: result.total[0]?.count ?? 0,
    last30Days: result.last30Days[0]?.count ?? 0,
    open: OPEN_STATUSES.reduce((sum, s) => sum + byStatus[s], 0),
    byStatus,
    byCategory: result.byCategory.map(({ _id, count }) => ({ category: _id, count })),
    byMonth,
    topRoutes: result.topRoutes.map(({ _id, count }) => ({ routeNumber: _id, count })),
    topBuses: result.topBuses.map(({ _id, count, busName }) => ({
      busNumber: _id,
      busName,
      count,
    })),
    repeatOffenders: result.repeatOffenders.map(({ _id, count, lastReportedAt }) => ({
      busNumber: _id,
      count,
      lastReportedAt,
    })),
    avgResolutionHours: resolution ? Math.round((resolution.avgMs / 36e5) * 10) / 10 : null,
    resolvedWithTiming: resolution?.count ?? 0,
  });
};

// @desc    Get report by ID (Admin only)
// @route   GET /api/reports/:id
// @access  Private (Admin)
export const getReportById = async (req: Request<IdParams>, res: Response) => {
  const report = await ReportModel.findById(req.params.id);
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
  const report = await findByReceiptId(req.params.receiptId);
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

  const report = await ReportModel.findById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  if (report.status === status && !note) {
    res.status(400).json({ msg: "Status is unchanged" });
    return;
  }

  // Older reports have no history yet; record where they started
  if (report.statusHistory.length === 0) {
    report.statusHistory.push({ status: report.status, changedAt: report.reportedAt });
  }

  if (report.status !== status) {
    report.resolvedAt = status === "resolved" ? new Date() : undefined;
  }
  report.status = status;
  report.statusHistory.push({
    status,
    note,
    changedBy: req.admin?.email,
    changedAt: new Date(),
  });
  await report.save();

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

  res.json({ ...report.toObject(), emailSent });
};

// @desc    Add an internal note to a report (Admin only)
// @route   POST /api/reports/:id/notes
// @access  Private (Admin)
export const addNote = async (req: Request<IdParams, object, AddNoteInput>, res: Response) => {
  const report = await ReportModel.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: { text: req.body.text, author: req.admin?.email } } },
    { returnDocument: "after" },
  );
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  res.status(201).json(report);
};

// @desc    Delete a report (Admin only)
// @route   DELETE /api/reports/:id
// @access  Private (Admin)
export const deleteReport = async (req: Request<IdParams>, res: Response) => {
  const report = await ReportModel.findById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }

  // Clean up Cloudinary files; a failure here should not block the delete
  const destroy = (publicId: string, resourceType: "image" | "video" | "raw") =>
    cloudinary.uploader
      .destroy(publicId, { resource_type: resourceType })
      .catch((e: unknown) =>
        console.error(`Failed to delete ${publicId}:`, e instanceof Error ? e.message : e),
      );
  const publicIdFromUrl = (url: string) => url.split("/").pop()?.split(".")[0] ?? "";

  await Promise.all([
    ...report.images.map((url) => destroy(publicIdFromUrl(url), "image")),
    ...report.videos.map((url) => destroy(publicIdFromUrl(url), "video")),
    destroy(`buswatch_receipts/receipt_${report.id}`, "raw"),
  ]);

  await report.deleteOne();
  res.json({ msg: "Report removed" });
};
