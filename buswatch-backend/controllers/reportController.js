const Report = require("../models/Report");
const cloudinary = require("../config/cloudinary");
const { sendReportReceiptEmail } = require("../utils/emailService");
const { generatePdfReceipt } = require("../utils/generateReceipt");
const { v4: uuidv4 } = require("uuid");
const generateUniqueId = require("../utils/generateUniqueId");

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
      locationName,
      description,
      passengerEmail,
    } = req.body;

    // Generate receiptId early
    const newReceiptId = generateUniqueId(); // Generate a unique ID

    const images = [];
    const videos = [];

    // ... (Your Cloudinary file upload logic remains the same) ...
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(
          file.path ||
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            resource_type: file.mimetype.startsWith("image")
              ? "image"
              : "video",
          }
        );
        if (file.mimetype.startsWith("image")) {
          images.push(result.secure_url);
        } else {
          videos.push(result.secure_url);
        }
      }
    }

    const newReport = new Report({
      busNumber,
      routeNumber,
      busName,
      location: {
        type: "Point",
        coordinates: [
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ],
      },
      locationName,
      description,
      images,
      videos,
      receiptId: newReceiptId, // <--- Assign the generated unique ID here!
    });

    const savedReport = await newReport.save(); // Only one save needed here

    // Generate PDF receipt (now with a guaranteed receiptId)
    const receiptDetails = await generatePdfReceipt({
      ...savedReport.toObject(),
      locationName: locationName,
      receiptId: savedReport.receiptId, // Pass the already saved receiptId
    });

    // Send receipt email to passenger
    if (passengerEmail && savedReport.receiptId) {
      await sendReportReceiptEmail(
        passengerEmail,
        receiptDetails.pdfBuffer, // Assuming generatePdfReceipt returns pdfBuffer
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
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.errors });
    }
    // Handle duplicate key error specifically if it happens despite the above (unlikely now)
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate receipt ID detected. Please try again." });
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
