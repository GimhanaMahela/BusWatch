const Report = require("../models/Report");
const cloudinary = require("../config/cloudinary"); // Ensure Cloudinary is configured
const { sendReportReceiptEmail } = require("../utils/emailService");
const { v4: uuidv4 } = require("uuid"); // This import is not used in the provided snippet, consider removing if unused
const generateUniqueId = require("../utils/generateUniqueId");
const fs = require("fs"); // Not directly used for serving in this corrected version, but kept for context
const path = require("path"); // Not directly used for serving in this corrected version, but kept for context
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
      return res.status(400).json({
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
    const receiptDetails = await generatePdfReceipt({
      ...savedReport.toObject(),
      location: savedReport.location,
      receiptId: savedReport.receiptId,
    });

    let pdfPublicUrl = null; // Initialize a variable for the PDF URL

    if (receiptDetails && receiptDetails.pdfBuffer) {
      try {
        // Convert buffer to base64 string for Cloudinary upload
        const pdfBase64 = `data:application/pdf;base64,${receiptDetails.pdfBuffer.toString(
          "base64"
        )}`;
        const pdfUploadResult = await cloudinary.uploader.upload(pdfBase64, {
          resource_type: "raw", // Use 'raw' for PDF files
          folder: "buswatch_receipts", // Optional: organize your PDFs in a specific folder
          public_id: `receipt_${savedReport._id}`, // Optional: unique ID for the PDF
          // Add this line to ensure Cloudinary serves it inline if possible,
          // though direct Cloudinary URLs often default to download for 'raw'
          // You might need to configure a custom CNAME or proxy for full control
          // over Content-Disposition from Cloudinary itself.
          // For direct server response, this would be set on res.setHeader.
        });
        pdfPublicUrl = pdfUploadResult.secure_url;
        console.log(`PDF receipt uploaded to Cloudinary: ${pdfPublicUrl}`);
      } catch (uploadError) {
        console.error("Failed to upload PDF to Cloudinary:", uploadError);
        // Handle this error gracefully, e.g., send an email without PDF link
      }
    } else {
      console.warn("PDF buffer not available from generatePdfReceipt.");
    }

    // Update the report with the generated receiptId (if Option 2 was used)
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

    // Send the response with the public PDF URL
    res.status(201).json({
      msg: "Report submitted successfully!",
      report: savedReport,
      receiptId: savedReport.receiptId,
      pdfUrl: pdfPublicUrl, // This is the URL your frontend will use
    });
  } catch (err) {
    console.error("Error in submitReport:", err.message);
    if (err instanceof Error && err.name === "MulterError") {
      // Check for MulterError properly
      console.error("Multer Error:", err.code, err.field);
      return res.status(400).json({
        message: "File Upload Error",
        error: err.message,
        field: err.field,
      });
    }
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((el) => el.message);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: errors });
    }
    if (err.code === 11000) {
      return res.status(409).json({
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

// @desc    Get report by Receipt ID (Admin only)
// @route   GET /api/reports/receipt/:receiptId
// @access  Private (Admin)
exports.getReportByReceiptId = async (req, res) => {
  try {
    const report = await Report.findOne({ receiptId: req.params.receiptId }); // Find by receiptId field
    if (!report) {
      return res.status(404).json({ msg: "Report not found with this Receipt ID" });
    }
    res.json(report);
  } catch (err) {
    console.error(err.message);
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

    report.status = status;
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