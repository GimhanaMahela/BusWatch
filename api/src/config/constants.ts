// Shared enums used by models, validators and controllers.
// Keep in sync with ui/src/constants/reportConstants.ts

export const REPORT_STATUSES = [
  "pending",
  "reviewed",
  "escalated",
  "resolved",
  "rejected",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Statuses that still need action from the team */
export const OPEN_STATUSES = [
  "pending",
  "reviewed",
  "escalated",
] as const satisfies readonly ReportStatus[];

/** A complaint about an incident, or praise for a driver or crew ("Commend a driver"). */
export const REPORT_TYPES = ["complaint", "commendation"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const COMPLAINT_CATEGORIES = [
  "reckless_driving",
  "overcharging",
  "no_ticket",
  "refused_to_stop",
  "harassment",
  "overcrowding",
  "loud_music",
  "vehicle_condition",
  "staff_behaviour",
  "other",
] as const;

export const COMMENDATION_CATEGORIES = [
  "safe_driving",
  "helpful_staff",
  "clean_vehicle",
  "on_time",
  "fair_fare",
  "other",
] as const;

/** Every category value stored in the database ("other" is shared by both types). */
export const REPORT_CATEGORIES = [
  ...COMPLAINT_CATEGORIES,
  ...COMMENDATION_CATEGORIES.filter((c) => c !== "other"),
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORIES_BY_TYPE: Record<ReportType, readonly ReportCategory[]> = {
  complaint: COMPLAINT_CATEGORIES,
  commendation: COMMENDATION_CATEGORIES,
};

/** Languages passengers can use the site in; emails and PDF receipts follow the report's language. */
export const LANGUAGES = ["en", "si", "ta"] as const;
export type Language = (typeof LANGUAGES)[number];

/** How the passenger reached the form: directly, or by scanning the QR sticker inside a bus. */
export const REPORT_SOURCES = ["web", "qr"] as const;
export type ReportSource = (typeof REPORT_SOURCES)[number];

/** Statuses after which the passenger may rate how their report was handled */
export const RATEABLE_STATUSES = [
  "resolved",
  "rejected",
] as const satisfies readonly ReportStatus[];

// ---------------------------------------------------------------- Public results (Phase 2)

/**
 * Only reports an admin has checked count in public: pending ones are unverified and rejected
 * ones were found not to stand. Admins can also hide a single report (hiddenFromPublic).
 */
export const PUBLIC_STATUSES = [
  "reviewed",
  "escalated",
  "resolved",
] as const satisfies readonly ReportStatus[];

/**
 * Fairness rule: a bus or route gets a public scorecard only with at least this many checked
 * reports, so one angry passenger can't damage an operator's reputation.
 */
export const MIN_PUBLIC_REPORTS = 3;

/** Heatmap cells are about 5.5 km wide and only shown with at least this many reports. */
export const HEATMAP_CELL_DEGREES = 0.05;
export const MIN_HEATMAP_REPORTS = 3;

/** Generous box around Sri Lanka; map pins outside it are ignored on public maps. */
export const SRI_LANKA_BOUNDS = { minLat: 5.5, maxLat: 10.2, minLng: 79.3, maxLng: 82.2 } as const;

/**
 * Anonymous usage counters (counts per day only, nothing about the person).
 * They feed the Phase 1 success metrics on the admin analytics page.
 */
export const METRIC_EVENTS = [
  "report_form_started",
  "report_submitted",
  "commendation_form_started",
  "commendation_submitted",
  "qr_scan",
  "tracking_view",
  "tracking_return_view",
  "report_shared",
  "offline_report_queued",
  "app_installed",
  "impact_view",
  "scorecard_view",
  "my_reports_signin",
  "admin_message",
  "passenger_message",
  "push_subscribed",
] as const;
export type MetricEvent = (typeof METRIC_EVENTS)[number];

/** Events the browser may send; the rest are counted by the server itself. */
export const CLIENT_METRIC_EVENTS = [
  "report_form_started",
  "commendation_form_started",
  "qr_scan",
  "tracking_view",
  "tracking_return_view",
  "report_shared",
  "offline_report_queued",
  "app_installed",
  "impact_view",
  "scorecard_view",
] as const satisfies readonly MetricEvent[];

// ---------------------------------------------------------------- Two-way contact (Phase 3)

/** Who wrote a message on a report's conversation. */
export const MESSAGE_SENDERS = ["admin", "passenger"] as const;
export type MessageSender = (typeof MESSAGE_SENDERS)[number];

/** How a passenger signs in to "My reports": a one-time code sent by email or SMS. */
export const CONTACT_CHANNELS = ["email", "phone"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const PASSENGER_CODE = {
  digits: 6,
  ttlMinutes: 10,
  /** Wrong guesses allowed per code before it stops working */
  maxAttempts: 5,
  /** Codes one email address or phone number can be sent per window (each SMS costs money) */
  maxPerWindow: 3,
  windowMinutes: 15,
} as const;

/** "My reports" sessions last a month; passengers sign in again with a new code after that. */
export const PASSENGER_SESSION_DAYS = 30;

/** Passengers can still reply this many days after their report was closed. */
export const REPLY_WINDOW_DAYS = 30;

export const MAX_MESSAGE_LENGTH = 2000;

export const ADMIN_ROLES = ["superadmin", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const UPLOAD_LIMITS = {
  maxImages: 5,
  maxVideos: 2,
  maxFileBytes: 10 * 1024 * 1024,
} as const;
