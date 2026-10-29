const mongoose = require("mongoose");
const Report = require("../models/report.model");
const cloudinary = require("../config/cloudinary");
const {
  sendReportReceiptEmail,
  sendStatusUpdateEmail,
} = require("../services/email.service");
const generateUniqueId = require("../utils/receipt-id");
const generatePdfReceipt = require("../services/pdf-receipt.service");
const { REPORT_STATUSES, REPORT_CATEGORIES } = require("../config/constants");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPEN_STATUSES = ["pending", "reviewed", "escalated"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Receipt IDs are upper-case (BW-2026-XXXXXX); older reports use lower-case UUIDs
const findByReceiptId = (rawId) => {
  const id = String(rawId || "").trim();
  return Report.findOne({
    receiptId: { $in: [id, id.toUpperCase(), id.toLowerCase()] },
  });
};

const uploadMedia = (file, resourceType) =>
  cloudinary.uploader
    .upload(`data:${file.mimetype};base64,${file.buffer.toString("base64")}`, {
      resource_type: resourceType,
    })
    .then((result) => result.secure_url);

// What a passenger may see about their own report: no media, email or internal notes
const toPublicView = (report) => {
  const timeline =
    report.statusHistory && report.statusHistory.length > 0
      ? report.statusHistory.map(({ status, note, changedAt }) => ({
          status,
          note,
          changedAt,
        }))
      : [{ status: "pending", changedAt: report.reportedAt }];

  // Reports created before status history existed only know their current status
  if (timeline[timeline.length - 1].status !== report.status) {
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

const parseIncidentAt = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Allow a few minutes of clock skew, but no future incidents
  if (date.getTime() > Date.now() + 5 * 60 * 1000) return null;
  return date;
};

const parseCoordinates = (lat, lng) => {
  if (lat === undefined || lat === "" || lng === undefined || lng === "") {
    return undefined;
  }
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return { type: "Point", coordinates: [longitude, latitude] };
};

const generateFreeReceiptId = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateUniqueId();
    if (!(await Report.exists({ receiptId: id }))) return id;
  }
  throw new Error("Could not generate a unique receipt ID");
};

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Public
exports.submitReport = async (req, res) => {
  try {
    const {
      busNumber,
      routeNumber,
      busName,
      category,
      location,
      latitude,
      longitude,
      incidentAt,
      description,
      passengerEmail,
      website, // Honeypot: hidden from people, filled in by bots
    } = req.body;

    if (website) {
      return res.status(400).json({ message: "Invalid submission." });
    }

    if (!busNumber || !routeNumber || !location || !description) {
      return res.status(400).json({
        message:
          "Missing required report fields (Bus Number, Route Number, Location, Description).",
      });
    }
    if (description.length > 5000) {
      return res
        .status(400)
        .json({ message: "Description must be 5000 characters or fewer." });
    }
    if (category && !REPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid incident category." });
    }
    if (passengerEmail && !EMAIL_RE.test(passengerEmail)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const parsedIncidentAt = parseIncidentAt(incidentAt);
    if (parsedIncidentAt === null) {
      return res
        .status(400)
        .json({ message: "Incident date/time is invalid or in the future." });
    }

    const coordinates = parseCoordinates(latitude, longitude);
    if (coordinates === null) {
      return res.status(400).json({ message: "Invalid map coordinates." });
    }

    const receiptId = await generateFreeReceiptId();

    const [images, videos] = await Promise.all([
      Promise.all((req.files?.images || []).map((f) => uploadMedia(f, "image"))),
      Promise.all((req.files?.videos || []).map((f) => uploadMedia(f, "video"))),
    ]);

    const report = new Report({
      busNumber,
      routeNumber,
      busName,
      category: category || "other",
      location,
      coordinates,
      incidentAt: parsedIncidentAt,
      description,
      passengerEmail: passengerEmail || undefined,
      images,
      videos,
      receiptId,
      statusHistory: [{ status: "pending", note: "Report received." }],
    });

    await report.save();

    // Everything below is best-effort: the report is already saved, so a PDF or
    // email failure must not turn into an error response (the passenger would resubmit).
    let pdfBuffer = null;
    try {
      ({ pdfBuffer } = await generatePdfReceipt(report.toObject()));
      const pdfUploadResult = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
        {
          resource_type: "raw",
          folder: "buswatch_receipts",
          public_id: `receipt_${report._id}`,
        }
      );
      report.pdfUrl = pdfUploadResult.secure_url;
      await report.save();
    } catch (pdfError) {
      console.error("Failed to generate or upload PDF receipt:", pdfError.message);
    }

    let emailSent = false;
    if (report.passengerEmail && pdfBuffer) {
      try {
        emailSent = await sendReportReceiptEmail(report.passengerEmail, pdfBuffer, receiptId);
      } catch (emailError) {
        console.error("Failed to send receipt email:", emailError.message);
      }
    }

    res.status(201).json({
      msg: "Report submitted successfully!",
      report: toPublicView(report),
      receiptId,
      pdfUrl: report.pdfUrl || null,
      emailSent,
    });
  } catch (err) {
    console.error("Error in submitReport:", err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((el) => el.message);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: errors });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Track a report's status by receipt ID
// @route   GET /api/reports/track/:receiptId
// @access  Public
exports.trackReport = async (req, res) => {
  try {
    const report = await findByReceiptId(req.params.receiptId);
    if (!report) {
      return res
        .status(404)
        .json({ msg: "No report found with this Receipt ID." });
    }
    res.json(toPublicView(report));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get reports with filters and pagination (Admin only)
// @route   GET /api/reports?page&limit&status&category&q&from&to
// @access  Private (Admin)
exports.getAllReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const { status, category, q, from, to } = req.query;

    const filter = {};
    if (status) {
      if (status === "open") filter.status = { $in: OPEN_STATUSES };
      else if (REPORT_STATUSES.includes(status)) filter.status = status;
    }
    if (category && REPORT_CATEGORIES.includes(category)) {
      filter.category = category;
    }
    if (q && q.trim()) {
      const re = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { receiptId: re },
        { busNumber: re },
        { routeNumber: re },
        { busName: re },
        { location: re },
      ];
    }
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (
      (fromDate && !Number.isNaN(fromDate.getTime())) ||
      (toDate && !Number.isNaN(toDate.getTime()))
    ) {
      filter.reportedAt = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) filter.reportedAt.$gte = fromDate;
      if (toDate && !Number.isNaN(toDate.getTime())) {
        // Make "to" inclusive of the whole day when only a date is given
        if (/^\d{4}-\d{2}-\d{2}$/.test(to)) toDate.setUTCHours(23, 59, 59, 999);
        filter.reportedAt.$lte = toDate;
      }
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select("-notes -statusHistory")
        .sort({ reportedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    res.json({
      reports,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Dashboard statistics (Admin only)
// @route   GET /api/reports/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [result] = await Report.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          last30Days: [
            { $match: { reportedAt: { $gte: thirtyDaysAgo } } },
            { $count: "count" },
          ],
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

    // Fill in empty months so the trend has no gaps
    const monthCounts = Object.fromEntries(result.byMonth.map((m) => [m._id, m.count]));
    const byMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.push({ month: key, count: monthCounts[key] || 0 });
    }

    const byStatus = Object.fromEntries(REPORT_STATUSES.map((s) => [s, 0]));
    result.byStatus.forEach(({ _id, count }) => {
      byStatus[_id] = count;
    });

    const resolution = result.resolution[0];
    res.json({
      total: result.total[0]?.count || 0,
      last30Days: result.last30Days[0]?.count || 0,
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
      avgResolutionHours: resolution
        ? Math.round((resolution.avgMs / 36e5) * 10) / 10
        : null,
      resolvedWithTiming: resolution?.count || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get report by ID (Admin only)
// @route   GET /api/reports/:id
// @access  Private (Admin)
exports.getReportById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ msg: "Report not found" });
    }
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get report by Receipt ID (Admin only)
// @route   GET /api/reports/receipt/:receiptId
// @access  Private (Admin)
exports.getReportByReceiptId = async (req, res) => {
  try {
    const report = await findByReceiptId(req.params.receiptId);
    if (!report) {
      return res.status(404).json({ msg: "Report not found with this Receipt ID" });
    }
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update report status, optionally with a message to the passenger (Admin only)
// @route   PUT /api/reports/:id/status
// @access  Private (Admin)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, note, notifyPassenger = true } = req.body;
    if (!REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }
    if (note && note.length > 2000) {
      return res.status(400).json({ msg: "Message must be 2000 characters or fewer" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ msg: "Report not found" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }
    if (report.status === status && !note) {
      return res.status(400).json({ msg: "Status is unchanged" });
    }

    // Older reports have no history yet; record where they started
    if (!report.statusHistory || report.statusHistory.length === 0) {
      report.statusHistory = [{ status: report.status, changedAt: report.reportedAt }];
    }

    if (report.status !== status) {
      report.resolvedAt = status === "resolved" ? new Date() : undefined;
    }
    report.status = status;
    report.statusHistory.push({
      status,
      note: note ? note.trim() : undefined,
      changedBy: req.admin?.email,
    });
    await report.save();

    let emailSent = false;
    if (notifyPassenger && report.passengerEmail) {
      try {
        emailSent = await sendStatusUpdateEmail(
          report.passengerEmail,
          report.receiptId,
          status,
          note
        );
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError.message);
      }
    }

    res.json({ ...report.toObject(), emailSent });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Add an internal note to a report (Admin only)
// @route   POST /api/reports/:id/notes
// @access  Private (Admin)
exports.addNote = async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ msg: "Note text is required" });
    }
    if (text.length > 2000) {
      return res.status(400).json({ msg: "Note must be 2000 characters or fewer" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ msg: "Report not found" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text, author: req.admin?.email } } },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }
    res.status(201).json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete a report (Admin only)
// @route   DELETE /api/reports/:id
// @access  Private (Admin)
exports.deleteReport = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ msg: "Report not found" });
    }
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    // Clean up Cloudinary files; a failure here should not block the delete
    const destroy = (publicId, resourceType) =>
      cloudinary.uploader
        .destroy(publicId, { resource_type: resourceType })
        .catch((e) => console.error(`Failed to delete ${publicId}:`, e.message));
    const publicIdFromUrl = (url) => url.split("/").pop().split(".")[0];

    await Promise.all([
      ...report.images.map((url) => destroy(publicIdFromUrl(url), "image")),
      ...report.videos.map((url) => destroy(publicIdFromUrl(url), "video")),
      destroy(`buswatch_receipts/receipt_${report._id}`, "raw"),
    ]);

    await Report.deleteOne({ _id: req.params.id });
    res.json({ msg: "Report removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
