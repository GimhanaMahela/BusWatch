const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth"); // For admin routes

// @route   POST /api/reports
// @desc    Submit a new report
// @access  Public
router.post("/", upload.array("media", 5), reportController.submitReport); // 'media' is the field name for files, 5 is max count

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private (Admin)
router.get("/", auth, reportController.getAllReports);

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private (Admin)
router.get("/:id", auth, reportController.getReportById);

// @route   PUT /api/reports/:id/status
// @desc    Update report status
// @access  Private (Admin)
router.put("/:id/status", auth, reportController.updateReportStatus);

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private (Admin)
router.delete("/:id", auth, reportController.deleteReport);

module.exports = router;
