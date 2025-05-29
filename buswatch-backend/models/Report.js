const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  busNumber: { type: String, required: true },
  routeNumber: { type: String, required: true },
  busName: { type: String }, // Not required
  location: { type: String, required: true }, // Human-readable location from Google Maps
  description: { type: String, required: true },
  images: [{ type: String }], // URLs from Cloudinary
  videos: [{ type: String }], // URLs from Cloudinary
  reportedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved"],
    default: "pending",
  },
  receiptId: { type: String, unique: true }, // Unique ID for the receipt
});

// ReportSchema.index({ location: "2dsphere" }); // For geospatial queries if needed

module.exports = mongoose.model("Report", ReportSchema);
