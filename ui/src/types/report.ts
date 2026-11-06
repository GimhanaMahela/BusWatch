import type {
  Language,
  ReportCategory,
  ReportStatus,
  ReportType,
} from "@/constants/reportConstants";

export interface StatusChange {
  status: ReportStatus;
  note?: string;
  changedBy?: string;
  changedAt: string;
}

export interface InternalNote {
  id: string;
  text: string;
  author?: string;
  createdAt: string;
}

export type MessageSender = "admin" | "passenger";

/** A message on a report's conversation, as admins see it */
export interface ReportMessage {
  id: string;
  sender: MessageSender;
  body: string;
  /** Admin email for team messages */
  author?: string | null;
  createdAt: string;
  readAt?: string | null;
}

/** A message as the passenger sees it: never the admin's name */
export interface PublicMessage {
  id: string;
  sender: MessageSender;
  body: string;
  createdAt: string;
  /** For the passenger's own messages: has the team seen it? */
  read: boolean;
}

/** Which channels reached the passenger after an update */
export interface Delivery {
  email: boolean;
  sms: boolean;
  /** Devices reached by browser push */
  push: number;
  /** Telegram chats reached */
  telegram: number;
}

/** Full report as admins see it */
export interface Report {
  id: string;
  receiptId: string;
  type: ReportType;
  busNumber: string;
  routeNumber: string;
  busName?: string | null;
  category: ReportCategory;
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  images: string[];
  videos: string[];
  incidentAt?: string;
  reportedAt: string;
  passengerEmail?: string;
  passengerPhone?: string | null;
  language: Language;
  source: "web" | "qr";
  status: ReportStatus;
  statusHistory?: StatusChange[];
  notes?: InternalNote[];
  resolvedAt?: string;
  pdfUrl?: string;
  outcomeRating?: number | null;
  outcomeFeedback?: string | null;
  ratedAt?: string | null;
  hiddenFromPublic?: boolean;
  messages?: ReportMessage[];
  /** Report lists only: passenger messages no admin has read yet */
  unreadMessages?: number;
}

/** What the public tracking endpoint returns */
export interface PublicReport {
  receiptId: string;
  type: ReportType;
  status: ReportStatus;
  category: ReportCategory;
  busNumber: string;
  routeNumber: string;
  location: string | null;
  incidentAt?: string;
  reportedAt: string;
  resolvedAt?: string;
  timeline: { status: ReportStatus; note?: string; changedAt: string }[];
  /** True once a complaint is closed: the passenger may rate how it was handled */
  canRate: boolean;
  rating: number | null;
  feedback: string | null;
  ratedAt: string | null;
  messages: PublicMessage[];
  /** False once the report has been closed for a while */
  canReply: boolean;
}

export interface SubmitReportFields {
  type?: ReportType;
  busNumber: string;
  routeNumber: string;
  busName?: string;
  category: ReportCategory | "";
  incidentAt?: string;
  location?: string;
  latitude?: number | "";
  longitude?: number | "";
  description: string;
  passengerEmail?: string;
  passengerPhone?: string;
  language?: Language;
  source?: "web" | "qr";
  website?: string;
}

export interface SubmitReportResponse {
  msg: string;
  receiptId: string;
  pdfUrl: string | null;
  emailSent: boolean;
  smsSent?: boolean;
  report: PublicReport;
}

export interface ReportListParams {
  page?: number | string;
  limit?: number | string;
  status?: string;
  category?: string;
  type?: ReportType;
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
  commendations: CommendationStats;
  engagement: EngagementStats;
}

export interface CommendationStats {
  total: number;
  last30Days: number;
  open: number;
  byStatus: Record<ReportStatus, number>;
  byCategory: { category: ReportCategory; count: number }[];
  topBuses: { busNumber: string; busName?: string | null; count: number }[];
}

/** Phase 1 success metrics over the last `periodDays` days */
export interface EngagementStats {
  periodDays: number;
  formStarts: number;
  formSubmits: number;
  formCompletionRate: number | null;
  trackingViews: number;
  trackingReturnViews: number;
  qrScans: number;
  qrReports: number;
  webReports: number;
  shares: number;
  offlineQueued: number;
  appInstalls: number;
  avgFirstResponseHours: number | null;
  respondedReports: number;
  avgRating: number | null;
  ratingsCount: number;
  ratingDistribution: { rating: number; count: number }[];
  recentFeedback: {
    id: string;
    receiptId: string;
    rating: number;
    feedback: string;
    ratedAt: string;
  }[];
  byLanguage: Record<Language, number>;
  // Two-way contact (Phase 3)
  adminMessages: number;
  passengerMessages: number;
  myReportsSignins: number;
  pushSubscriptions: number;
  telegramLinks: number;
}

/** A report in "My reports" */
export interface PassengerReportSummary {
  receiptId: string;
  type: ReportType;
  status: ReportStatus;
  category: ReportCategory;
  busNumber: string;
  routeNumber: string;
  reportedAt: string;
  resolvedAt: string | null;
  lastUpdateAt: string;
  /** Team messages the passenger hasn't read */
  unreadMessages: number;
}

export interface PassengerContactInfo {
  channel: "email" | "phone";
  /** Masked, e.g. "ka***@gmail.com" or "+9477***4567" */
  display: string;
}
