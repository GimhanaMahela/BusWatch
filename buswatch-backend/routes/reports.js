const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
// const upload = require("../middleware/upload"); // <--- REMOVE OR COMMENT OUT THIS LINE
const auth = require("../middleware/auth"); // For admin routes
const multer = require("multer");

// --- Multer Configuration ---
// This is the *only* place you should define 'upload' if it's meant to be used here.
const storage = multer.memoryStorage(); // Store files in memory (recommended for Cloudinary)
const upload = multer({ storage: storage });
// --- End Multer Configuration ---

// @route   POST /api/reports
// @desc    Submit a new report
// @access  Public
// This route now correctly handles 'images' and 'videos' fields from form-data
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 }, // Accepts up to 10 images
    { name: "videos", maxCount: 5 }, // Accepts up to 5 videos
  ]),
  reportController.submitReport
);

// --- Admin Routes (Keep these as they are) ---
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
