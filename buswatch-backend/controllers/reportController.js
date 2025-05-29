const Report = require("../models/Report");
const cloudinary = require("../config/cloudinary");
const { sendReportReceiptEmail } = require("../utils/emailService");
const { v4: uuidv4 } = require("uuid");
const generateUniqueId = require("../utils/generateUniqueId");
const fs = require("fs");
const path = require("path");
const generatePdfReceipt = require("../utils/generatePdfReceipt");

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Public
exports.submitReport = async (req, res) => {
  try {
    const {
      busNumber,
      routeNumber,
      busName,
      location, 
      description,
      passengerEmail,
      status, 
    } = req.body;

    // Optional: Basic validation for required string fields
    if (!busNumber || !routeNumber || !location || !description) {
      return res
        .status(400)
        .json({
          message:
            "Missing required report fields (Bus Number, Route Number, Location, Description).",
        });
    }

    // Generate receiptId early
    const newReceiptId = generateUniqueId();

    const images = [];
    const videos = [];

    // Process uploaded files
    if (req.files) {
      if (req.files.images) {
        for (const file of req.files.images) {
          const uploadSource =
            file.path ||
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
          const result = await cloudinary.uploader.upload(uploadSource, {
            resource_type: "image",
          });
          images.push(result.secure_url);
        }
      }

      if (req.files.videos) {
        for (const file of req.files.videos) {
          const uploadSource =
            file.path ||
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
          const result = await cloudinary.uploader.upload(uploadSource, {
            resource_type: "video",
          });
          videos.push(result.secure_url);
        }
      }
    }

    const newReport = new Report({
      busNumber,
      routeNumber,
      busName,
      location, // Now a string
      description,
      images,
      videos,
      receiptId: newReceiptId,
    });

    const savedReport = await newReport.save();

    // Generate PDF receipt (now with a guaranteed receiptId)
    // Ensure generatePdfReceipt is updated to accept a string location
    const receiptDetails = await generatePdfReceipt({
      ...savedReport.toObject(),
      location: savedReport.location, 
      receiptId: savedReport.receiptId,
    });

    // --- TEMPORARY: Save PDF to a file for testing ---
    if (receiptDetails && receiptDetails.pdfBuffer) {
      const reportsDir = path.join(__dirname, "..", "reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      const filePath = path.join(reportsDir, `receipt_${savedReport._id}.pdf`);
      fs.writeFileSync(filePath, receiptDetails.pdfBuffer);
      console.log(`PDF receipt saved to: ${filePath}`);
    } else {
      console.warn("PDF buffer not available from generatePdfReceipt.");
    }
    // --- END TEMPORARY ---

    // Update the report with the generated receiptId (if Option 2 was used)
    // This block might be redundant if receiptId is already set before save
    // Removed the receiptDetails.receiptId check from savedReport.receiptId comparison
    // as receiptDetails might not return receiptId if it's already set in savedReport
    if (
      receiptDetails &&
      receiptDetails.receiptId &&
      savedReport.receiptId !== receiptDetails.receiptId
    ) {
      savedReport.receiptId = receiptDetails.receiptId;
      await savedReport.save();
    } else if (!receiptDetails || !receiptDetails.receiptId) {
      console.warn(
        "generatePdfReceipt did not return a receiptId. Report saved without receiptId."
      );
    }

    // Send receipt email to passenger
    if (
      passengerEmail &&
      savedReport.receiptId &&
      receiptDetails &&
      receiptDetails.pdfBuffer
    ) {
      await sendReportReceiptEmail(
        passengerEmail,
        receiptDetails.pdfBuffer,
        savedReport.receiptId
      );
    }

    res.status(201).json({
      msg: "Report submitted successfully!",
      report: savedReport,
      receiptId: savedReport.receiptId,
    });
  } catch (err) {
    console.error("Error in submitReport:", err.message);
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err.code, err.field);
      return res
        .status(400)
        .json({
          message: "File Upload Error",
          error: err.message,
          field: err.field,
        });
    }
    if (err.name === "ValidationError") {
      // Mongoose validation errors
      const errors = Object.values(err.errors).map((el) => el.message);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: errors });
    }
    if (err.code === 11000) {
      // Mongoose duplicate key error (for unique fields like receiptId)
      return res
        .status(409)
        .json({
          message:
            "Duplicate receipt ID detected or unique constraint violation. Please try again.",
        });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private (Admin)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ reportedAt: -1 });
    res.json(reports);
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
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }
    res.json(report);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Report not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Update report status (Admin only)
// @route   PUT /api/reports/:id/status
// @access  Private (Admin)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    report.status = status;ADMIN_EMAIL;
    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Report not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Delete a report (Admin only)
// @route   DELETE /api/reports/:id
// @access  Private (Admin)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    // Optionally delete images/videos from Cloudinary here
    for (const imageUrl of report.images) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    for (const videoUrl of report.videos) {
      const publicId = videoUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    }

    await Report.deleteOne({ _id: req.params.id }); // Use deleteOne with query
    res.json({ msg: "Report removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Report not found" });
    }
    res.status(500).send("Server Error");
  }
};
