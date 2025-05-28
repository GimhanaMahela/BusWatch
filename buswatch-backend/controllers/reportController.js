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
    // --- IMPORTANT CHANGE HERE ---
    // Destructure flat fields, and get longitude/latitude directly from req.body
    const {
      busNumber,
      routeNumber,
      busName,
      locationName,
      description,
      passengerEmail,
      status // If you are sending 'status' as well
    } = req.body;

    // Directly access location.longitude and location.latitude from req.body
    const longitude = req.body['location.longitude']; // Access using bracket notation for string keys
    const latitude = req.body['location.latitude'];   // Access using bracket notation for string keys

    // --- You can add a console.log here to inspect req.body ---
    // console.log("Incoming req.body:", req.body);
    // console.log("Parsed Longitude:", longitude);
    // console.log("Parsed Latitude:", latitude);

    // Basic validation for longitude and latitude (optional but recommended)
    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ message: "Location data (longitude, latitude) is required." });
    }
    // --- END IMPORTANT CHANGE ---

    // Generate receiptId early
    const newReceiptId = generateUniqueId();

    const images = [];
    const videos = [];

    // --- Process uploaded files (this part was already adjusted correctly) ---
    if (req.files) {
      if (req.files.images) {
        for (const file of req.files.images) {
          const result = await cloudinary.uploader.upload(
            file.path || `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            { resource_type: 'image' }
          );
          images.push(result.secure_url);
        }
      }

      if (req.files.videos) {
        for (const file of req.files.videos) {
          const result = await cloudinary.uploader.upload(
            file.path || `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            { resource_type: 'video' }
          );
          videos.push(result.secure_url);
        }
      }
    }
    // --- End file processing ---

    const newReport = new Report({
      busNumber,
      routeNumber,
      busName,
      location: { // Now create the nested 'location' object here
        type: "Point",
        coordinates: [
          parseFloat(longitude), // Use the directly accessed 'longitude'
          parseFloat(latitude),  // Use the directly accessed 'latitude'
        ],
      },
      locationName,
      description,
      images,
      videos,
      receiptId: newReceiptId,
    });

    const savedReport = await newReport.save();

    // Generate PDF receipt (now with a guaranteed receiptId)
    const receiptDetails = await generatePdfReceipt({
      ...savedReport.toObject(),
      locationName: locationName,
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
    if (receiptDetails && receiptDetails.receiptId && savedReport.receiptId !== receiptDetails.receiptId) {
      savedReport.receiptId = receiptDetails.receiptId;
      await savedReport.save();
    } else if (!receiptDetails || !receiptDetails.receiptId) {
      console.warn(
        "generatePdfReceipt did not return a receiptId. Report saved without receiptId."
      );
    }

    // Send receipt email to passenger
    if (passengerEmail && savedReport.receiptId) {
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
        return res.status(400).json({ message: "File Upload Error", error: err.message, field: err.field });
    }
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.errors });
    }
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
