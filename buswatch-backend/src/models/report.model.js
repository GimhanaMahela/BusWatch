const mongoose = require("mongoose");
const { REPORT_STATUSES, REPORT_CATEGORIES } = require("../config/constants");

const StatusChangeSchema = new mongoose.Schema(
  {
    status: { type: String, enum: REPORT_STATUSES, required: true },
    note: { type: String }, // Public message shown to the passenger
    changedBy: { type: String }, // Admin email; never exposed publicly
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InternalNoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ReportSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, trim: true, uppercase: true },
  routeNumber: { type: String, required: true, trim: true },
  busName: { type: String, trim: true }, // Not required
  category: {
    type: String,
    enum: REPORT_CATEGORIES,
    default: "other",
  },
  location: { type: String, required: true }, // Human-readable location
  // Optional GPS point picked by the passenger: [longitude, latitude]
  coordinates: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: { type: [Number], default: undefined },
  },
  description: { type: String, required: true },
  images: [{ type: String }], // URLs from Cloudinary
  videos: [{ type: String }], // URLs from Cloudinary
  incidentAt: { type: Date }, // When the incident happened (passenger-provided)
  reportedAt: { type: Date, default: Date.now }, // When the report was submitted
  passengerEmail: { type: String, trim: true, lowercase: true },
  status: {
    type: String,
    enum: REPORT_STATUSES,
    default: "pending",
  },
  statusHistory: [StatusChangeSchema],
  notes: [InternalNoteSchema], // Admin-only notes
  resolvedAt: { type: Date },
  pdfUrl: { type: String },
  receiptId: { type: String, unique: true }, // Unique ID for the receipt
});

ReportSchema.index({ coordinates: "2dsphere" }, { sparse: true });
ReportSchema.index({ reportedAt: -1 });
ReportSchema.index({ busNumber: 1, reportedAt: -1 });

module.exports = mongoose.model("Report", ReportSchema);
