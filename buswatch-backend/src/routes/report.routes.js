const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth.middleware");
const { submitLimiter, trackLimiter } = require("../middleware/rate-limit.middleware");

// @route   POST /api/reports
// @desc    Submit a new report (multipart: "images" and "videos" files)
// @access  Public
router.post("/", submitLimiter, upload, reportController.submitReport);

// @route   GET /api/reports/track/:receiptId
// @desc    Public status lookup by receipt ID
// @access  Public
router.get("/track/:receiptId", trackLimiter, reportController.trackReport);

// --- Admin Routes ---
// Specific paths must stay above "/:id" so they are not treated as an ID

// @route   GET /api/reports
// @desc    Get reports (filters + pagination)
// @access  Private (Admin)
router.get("/", auth, reportController.getAllReports);

// @route   GET /api/reports/stats
// @desc    Dashboard statistics
// @access  Private (Admin)
router.get("/stats", auth, reportController.getStats);

// @route   GET /api/reports/receipt/:receiptId
// @desc    Get report by Receipt ID
// @access  Private (Admin)
router.get("/receipt/:receiptId", auth, reportController.getReportByReceiptId);

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private (Admin)
router.get("/:id", auth, reportController.getReportById);

// @route   PUT /api/reports/:id/status
// @desc    Update report status
// @access  Private (Admin)
router.put("/:id/status", auth, reportController.updateReportStatus);

// @route   POST /api/reports/:id/notes
// @desc    Add an internal note
// @access  Private (Admin)
router.post("/:id/notes", auth, reportController.addNote);

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private (Admin)
router.delete("/:id", auth, reportController.deleteReport);

module.exports = router;
