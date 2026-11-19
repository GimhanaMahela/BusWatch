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

/**
 * A complaint about an incident, praise for a driver or crew ("Commend a driver"), or something a
 * passenger left on a bus ("Lost something?").
 */
export const REPORT_TYPES = ["complaint", "commendation", "lost_item"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** Types the BusWatch helper chat and WhatsApp bot can write (lost items use the web form). */
export const ASSISTANT_REPORT_TYPES = [
  "complaint",
  "commendation",
] as const satisfies readonly ReportType[];

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
  "accessibility",
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

/** What was left on the bus ("Lost something?") */
export const LOST_ITEM_CATEGORIES = [
  "bag",
  "phone",
  "wallet",
  "documents",
  "keys",
  "clothing",
  "other",
] as const;

/** Every category value stored in the database ("other" is shared by every type). */
export const REPORT_CATEGORIES = [
  ...COMPLAINT_CATEGORIES,
  ...COMMENDATION_CATEGORIES.filter((c) => c !== "other"),
  ...LOST_ITEM_CATEGORIES.filter((c) => c !== "other"),
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORIES_BY_TYPE: Record<ReportType, readonly ReportCategory[]> = {
  complaint: COMPLAINT_CATEGORIES,
  commendation: COMMENDATION_CATEGORIES,
  lost_item: LOST_ITEM_CATEGORIES,
};

/** Accessibility complaints: what went wrong, ticked by the passenger (at least one). */
export const ACCESSIBILITY_ISSUES = [
  "priority_seat",
  "passed_by",
  "high_step",
  "no_help_boarding",
  "no_space_mobility_aid",
  "rushed",
] as const;
export type AccessibilityIssue = (typeof ACCESSIBILITY_ISSUES)[number];

/** Safety mode: what happened, ticked on the quick harassment form. */
export const SAFETY_KINDS = [
  "verbal",
  "staring",
  "touching",
  "followed",
  "filmed",
  "other",
] as const;
export type SafetyKind = (typeof SAFETY_KINDS)[number];

/** Languages passengers can use the site in; emails and PDF receipts follow the report's language. */
export const LANGUAGES = ["en", "si", "ta"] as const;
export type Language = (typeof LANGUAGES)[number];

/**
 * How the report reached us: the website, the website opened from the QR sticker inside a bus, or
 * a chat with the BusWatch WhatsApp bot.
 */
export const REPORT_SOURCES = ["web", "qr", "whatsapp"] as const;
export type ReportSource = (typeof REPORT_SOURCES)[number];

/** Sources the website's forms may claim ("whatsapp" is only set by the bot itself). */
export const WEB_REPORT_SOURCES = ["web", "qr"] as const satisfies readonly ReportSource[];

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
  "telegram_linked",
  "confirmation_offered",
  "report_confirmed",
  "operator_response",
  "ai_analysis",
  "ai_blur",
  "assistant_chat",
  "assistant_draft_opened",
  "whatsapp_message",
  "whatsapp_linked",
  "lost_item_submitted",
  "fare_checked",
  "safety_report_submitted",
  "trip_share_started",
  "emergency_shown",
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
  "confirmation_offered",
  "assistant_draft_opened",
  "emergency_shown",
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

// ---------------------------------------------------------------- Wider ecosystem (Phase 4)

/**
 * "Me too" confirmations: a passenger about to report the same bus, category and day is offered
 * the existing report to confirm instead of filing a duplicate.
 */
export const CONFIRMATION = {
  /** Only incidents from the last this-many days are offered or can be confirmed */
  maxAgeDays: 14,
  /** Matching reports offered at most */
  maxMatches: 3,
  maxCommentLength: 1000,
} as const;

/** Rough time of day shown with a match, so the passenger can tell if it's the same incident. */
export const PARTS_OF_DAY = ["morning", "afternoon", "evening", "night"] as const;
export type PartOfDay = (typeof PARTS_OF_DAY)[number];

/**
 * "operator" is a bus owner or company (Phase 4 operator portal): they sign in on the same page but
 * only see checked reports about their own fleet, never the admin console.
 */
export const ADMIN_ROLES = ["superadmin", "admin", "operator"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** The BusWatch team: everyone except operators. */
export const STAFF_ROLES = ["superadmin", "admin"] as const satisfies readonly AdminRole[];

export const MAX_OPERATOR_RESPONSE_LENGTH = 2000;

/** AI help: descriptions longer than this get a summary */
export const AI_SUMMARY_MIN_LENGTH = 400;

/** BusWatch helper chat: how much of a conversation the browser may send each time */
export const ASSISTANT = {
  maxMessages: 30,
  maxMessageLength: 2000,
} as const;

/** The BusWatch WhatsApp bot */
export const WHATSAPP = {
  /** WhatsApp only allows free-form messages this long after the passenger's last message */
  replyWindowHours: 24,
  /** A chat that has been quiet this long starts afresh (and its history is forgotten) */
  chatIdleHours: 24,
  /** Turns of conversation kept for the AI (each passenger message and each reply is one) */
  maxHistory: 20,
  /** Messages one number may send per hour (each costs some of the free AI quota) */
  maxMessagesPerHour: 40,
  /** Voice notes longer than this are not transcribed */
  maxVoiceBytes: 5 * 1024 * 1024,
} as const;

// ---------------------------------------------------------------- Passenger safety (Phase 5)

/**
 * Official fares: admins keep the NTC fare-stage table for each service class and the stops (with
 * their fare stage) of each route. The fare for a journey is the table's fare for the number of
 * stages travelled.
 */
export const SERVICE_CLASSES = ["normal", "semi_luxury", "luxury"] as const;
export type ServiceClass = (typeof SERVICE_CLASSES)[number];

export const FARES = {
  /** Stages one fare table can cover */
  maxStages: 400,
  /** Stops one route can have */
  maxStops: 300,
  /** Highest fare an admin can enter or a passenger can say they paid (rupees) */
  maxFare: 100_000,
} as const;

/**
 * "Share my trip": a passenger sends their position to a link a trusted contact can open. Only the
 * latest position is kept, and it is wiped when the trip ends.
 */
export const TRIP_SHARE = {
  /** A shared trip stops on its own after this long */
  maxHours: 6,
  /** Ended trips are deleted after this many days */
  keepDays: 2,
} as const;

/** Lost items are time-sensitive: operators see them straight away, before an admin checks them. */
export const OPERATOR_LOST_ITEM_STATUSES = [
  "pending",
  "reviewed",
  "escalated",
  "resolved",
] as const satisfies readonly ReportStatus[];

/** Buses one operator account can be given */
export const MAX_FLEET_SIZE = 500;

export const UPLOAD_LIMITS = {
  maxImages: 5,
  maxVideos: 2,
  maxFileBytes: 10 * 1024 * 1024,
} as const;
