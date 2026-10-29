import type { ReportCategory, ReportStatus } from "../constants/reportConstants";

export interface StatusChange {
  status: ReportStatus;
  note?: string;
  changedBy?: string;
  changedAt: string;
}

export interface InternalNote {
  _id: string;
  text: string;
  author?: string;
  createdAt: string;
}

/** Full report as admins see it */
export interface Report {
  _id: string;
  receiptId: string;
  busNumber: string;
  routeNumber: string;
  busName?: string;
  category: ReportCategory;
  location: string;
  coordinates?: { type: "Point"; coordinates: [longitude: number, latitude: number] };
  description: string;
  images: string[];
  videos: string[];
  incidentAt?: string;
  reportedAt: string;
  passengerEmail?: string;
  status: ReportStatus;
  statusHistory?: StatusChange[];
  notes?: InternalNote[];
  resolvedAt?: string;
  pdfUrl?: string;
}

/** What the public tracking endpoint returns */
export interface PublicReport {
  receiptId: string;
  status: ReportStatus;
  category: ReportCategory;
  busNumber: string;
  routeNumber: string;
  location: string;
  incidentAt?: string;
  reportedAt: string;
  resolvedAt?: string;
  timeline: { status: ReportStatus; note?: string; changedAt: string | null }[];
}

export interface SubmitReportFields {
  busNumber: string;
  routeNumber: string;
  busName?: string;
  category: ReportCategory | "";
  incidentAt?: string;
  location: string;
  latitude?: number | "";
  longitude?: number | "";
  description: string;
  passengerEmail?: string;
  website?: string;
}

export interface SubmitReportResponse {
  msg: string;
  receiptId: string;
  pdfUrl: string | null;
  emailSent: boolean;
  report: PublicReport;
}

export interface ReportListParams {
  page?: number | string;
  limit?: number | string;
  status?: string;
  category?: string;
  q?: string;
  from?: string;
  to?: string;
}

export interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  pages: number;
}

export interface ReportStats {
  total: number;
  last30Days: number;
  open: number;
  byStatus: Record<ReportStatus, number>;
  byCategory: { category: ReportCategory; count: number }[];
  byMonth: { month: string; count: number }[];
  topRoutes: { routeNumber: string; count: number }[];
  topBuses: { busNumber: string; busName?: string; count: number }[];
  repeatOffenders: { busNumber: string; count: number; lastReportedAt: string }[];
  avgResolutionHours: number | null;
  resolvedWithTiming: number;
}
