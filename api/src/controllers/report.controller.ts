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
  deleteReport as deleteReportRow,
  findReportById,
  findReportByReceiptId,
  getReportStats,
  listReports,
  setOutcomeRating,
  setReportHiddenFromPublic,
  updateReportStatus as updateReportStatusRow,
  type ReportWithRelations,
} from "../repositories/report.repository.js";
import { notifyPassenger as deliverToPassenger } from "../services/notification.service.js";
import { FareError, officialFare } from "../services/fare.service.js";
import { fileReport } from "../services/report-submission.service.js";
import type { ReportDetails } from "../db/schema.js";
import type { ReportDetailsInput } from "../validators/report.validator.js";
import { invalidateCache } from "../utils/ttl-cache.js";
import type { VisibilityInput } from "../validators/story.validator.js";
import type { ResponseVisibilityInput } from "../validators/operator.validator.js";
import {
  findOperatorsForBus,
  setOperatorResponseHidden,
} from "../repositories/operator.repository.js";
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

/** A road incident's plate is for admins only; everything else in the details may be shown. */
export const publicDetails = (details: ReportDetails | null) => {
  if (!details?.road?.vehicle) return details;
  const { plate: _plate, ...vehicle } = details.road.vehicle;
  return { ...details, road: { ...details.road, vehicle } };
};

/**
 * What a passenger may see about their own report: no media, contact details, internal notes or
 * admin names (messages show "TransitX team").
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
    extraCategories: report.extraCategories,
    busNumber: report.busNumber,
    routeNumber: report.routeNumber,
    busService: report.busService,
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
    // Accessibility issues ticked, the official fare, what was ticked on the safety form, or a
    // road incident's vehicle (without its plate: tracking links get shared)
    details: publicDetails(report.details),
    // Other passengers who said "me too" (a count only)
    confirmations: report.confirmations.length,
    // The bus operator's responses, unless an admin hid them
    operatorResponses: report.operatorResponses
      .filter((response) => !response.hidden)
      .map(({ body, organisation, createdAt }) => ({ body, organisation, createdAt })),
  };
};

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Public
/**
 * Turns the passenger's choices into what is stored: the fare becomes the official fare worked out
 * here (the browser only says which route, stops and class). Throws FareError when that fails.
 */
const storedDetails = async (input?: ReportDetailsInput): Promise<ReportDetails | null> => {
  if (!input) return null;
  const details: ReportDetails = {};
  if (input.accessibility) details.accessibility = input.accessibility;
  if (input.safety) details.safety = input.safety;
  if (input.fare) details.fare = await officialFare(input.fare);
  if (input.road) details.road = input.road;
  if (input.commendee) details.commendee = input.commendee;
  return Object.keys(details).length ? details : null;
};

/** The quick safety-mode form may leave the description empty: say what was ticked instead. */
const safetyDescription = (details: ReportDetails | null) =>
  `Quick safety report. What happened: ${
    details?.safety?.kinds.length ? details.safety.kinds.join(", ") : "not given"
  }.`;

export const submitReport = async (
  req: Request<object, object, SubmitReportInput>,
  res: Response,
) => {
  const {
    website: _honeypot,
    busNumber,
    routeNumber,
    busName,
    busService,
    details: detailsInput,
    extraCategories,
    ...fields
  } = req.body;
  // Road incidents aren't about a route bus: no bus number, route or bus name is kept
  const isRoad = fields.type === "road_incident";
  const files = (req.files ?? {}) as UploadedMedia;

  let details: ReportDetails | null;
  try {
    details = await storedDetails(detailsInput);
  } catch (error) {
    if (error instanceof FareError) {
      res.status(400).json({ msg: error.message, message: error.message, errors: [error.message] });
      return;
    }
    throw error;
  }

  const [images, videos] = await Promise.all([
    Promise.all((files.images ?? []).map((f) => uploadMedia(f, "image"))),
    Promise.all((files.videos ?? []).map((f) => uploadMedia(f, "video"))),
  ]);

  const { saved, pdfUrl, emailSent, smsSent } = await fileReport({
    ...fields,
    // The main category isn't repeated among the extras
    extraCategories: extraCategories.filter((c) => c !== fields.category),
    description: fields.description ?? safetyDescription(details),
    busNumber: isRoad ? "" : (busNumber ?? "").toUpperCase(),
    routeNumber: isRoad ? "" : (routeNumber ?? ""),
    busName: isRoad ? undefined : busName,
    busService: isRoad ? null : (busService ?? null),
    details,
    images,
    videos,
  });

  const report = await findReportById(saved.id);
  res.status(201).json({
    msg: "Report submitted successfully!",
    report: report ? toPublicView(report) : null,
    receiptId: saved.receiptId,
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

/** Road incidents aren't about a route bus, so no operator ever sees them. */
const operatorsFor = async (report: ReportWithRelations) =>
  report.type === "road_incident" ? [] : findOperatorsForBus(report.busNumber);

// @desc    Get report by ID (Admin only)
// @route   GET /api/reports/:id
// @access  Private (Admin)
export const getReportById = async (req: Request<IdParams>, res: Response) => {
  const report = await findReportById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  // Which operator accounts run this bus (they see it once an admin has checked it)
  res.json({ ...report, operators: await operatorsFor(report) });
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

// @desc    Show or hide a bus operator's response on the passenger's tracking page (Admin only)
// @route   PUT /api/reports/:id/operator-responses/:responseId
// @access  Private (Admin)
export const setOperatorResponseVisibility = async (
  req: Request<IdParams & { responseId: string }, object, ResponseVisibilityInput>,
  res: Response,
) => {
  const { id, responseId } = req.params;
  if (!(await setOperatorResponseHidden(id, responseId, req.body.hidden))) {
    res.status(404).json({ msg: "Response not found" });
    return;
  }
  const report = await findReportById(id);
  res.json(report ? { ...report, operators: await operatorsFor(report) } : null);
};
