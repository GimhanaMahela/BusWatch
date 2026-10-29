import type { Types } from "mongoose";
import { Schema, model, type HydratedDocument } from "mongoose";
import {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportStatus,
} from "../config/constants.js";

export interface StatusChange {
  status: ReportStatus;
  note?: string; // Public message shown to the passenger
  changedBy?: string; // Admin email; never exposed publicly
  changedAt: Date;
}

export interface InternalNote {
  _id: Types.ObjectId;
  text: string;
  author?: string;
  createdAt: Date;
}

export interface GeoPoint {
  type: "Point";
  coordinates: [longitude: number, latitude: number];
}

export interface Report {
  busNumber: string;
  routeNumber: string;
  busName?: string;
  category: ReportCategory;
  location: string; // Human-readable location
  coordinates?: GeoPoint; // Optional GPS point picked by the passenger
  description: string;
  images: string[]; // Cloudinary URLs
  videos: string[]; // Cloudinary URLs
  incidentAt?: Date; // When the incident happened (passenger-provided)
  reportedAt: Date; // When the report was submitted
  passengerEmail?: string;
  status: ReportStatus;
  statusHistory: StatusChange[];
  notes: InternalNote[]; // Admin-only notes
  resolvedAt?: Date;
  pdfUrl?: string;
  receiptId: string;
}

export type ReportDocument = HydratedDocument<Report>;

const StatusChangeSchema = new Schema<StatusChange>(
  {
    status: { type: String, enum: REPORT_STATUSES, required: true },
    note: { type: String },
    changedBy: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const InternalNoteSchema = new Schema<InternalNote>({
  text: { type: String, required: true },
  author: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ReportSchema = new Schema<Report>({
  busNumber: { type: String, required: true, trim: true, uppercase: true },
  routeNumber: { type: String, required: true, trim: true },
  busName: { type: String, trim: true },
  category: { type: String, enum: REPORT_CATEGORIES, default: "other" },
  location: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number], default: undefined },
  },
  description: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  incidentAt: { type: Date },
  reportedAt: { type: Date, default: Date.now },
  passengerEmail: { type: String, trim: true, lowercase: true },
  status: { type: String, enum: REPORT_STATUSES, default: "pending" },
  statusHistory: [StatusChangeSchema],
  notes: [InternalNoteSchema],
  resolvedAt: { type: Date },
  pdfUrl: { type: String },
  receiptId: { type: String, unique: true, required: true },
});

ReportSchema.index({ coordinates: "2dsphere" }, { sparse: true });
ReportSchema.index({ reportedAt: -1 });
ReportSchema.index({ busNumber: 1, reportedAt: -1 });

export const ReportModel = model<Report>("Report", ReportSchema);
