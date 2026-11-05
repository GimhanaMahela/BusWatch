// Keep in sync with api/src/config/constants.ts

export const CATEGORIES = [
  { value: "reckless_driving", label: "Reckless / dangerous driving" },
  { value: "overcharging", label: "Overcharging / wrong fare" },
  { value: "no_ticket", label: "Ticket not issued" },
  { value: "refused_to_stop", label: "Refused to stop / skipped halt" },
  { value: "harassment", label: "Harassment" },
  { value: "overcrowding", label: "Overcrowding" },
  { value: "loud_music", label: "Loud music" },
  { value: "vehicle_condition", label: "Poor vehicle condition" },
  { value: "staff_behaviour", label: "Rude driver / conductor" },
  { value: "other", label: "Other" },
] as const;

/** "Commend a driver" categories; "other" is shared with complaints */
export const COMMENDATION_CATEGORIES = [
  { value: "safe_driving", label: "Safe, careful driving" },
  { value: "helpful_staff", label: "Kind, helpful crew" },
  { value: "clean_vehicle", label: "Clean, well-kept bus" },
  { value: "on_time", label: "On time, every halt served" },
  { value: "fair_fare", label: "Correct fare and ticket" },
  { value: "other", label: "Other" },
] as const;

export type ComplaintCategory = (typeof CATEGORIES)[number]["value"];
export type CommendationCategory = (typeof COMMENDATION_CATEGORIES)[number]["value"];
export type ReportCategory = ComplaintCategory | CommendationCategory;

export const REPORT_TYPES = [
  { value: "complaint", label: "Complaint" },
  { value: "commendation", label: "Commendation" },
] as const;
export type ReportType = (typeof REPORT_TYPES)[number]["value"];

/** Site languages. `label` is the language's own name, shown in the switcher. */
export const LANGUAGES = [
  { value: "en", label: "English", short: "EN" },
  { value: "si", label: "සිංහල", short: "සිං" },
  { value: "ta", label: "தமிழ்", short: "த" },
] as const;
export type Language = (typeof LANGUAGES)[number]["value"];

export const languageLabel = (value?: string): string =>
  LANGUAGES.find((l) => l.value === value)?.label ?? "English";

/** Statuses after which a passenger may rate the outcome of a complaint */
export const RATEABLE_STATUSES = ["resolved", "rejected"] as const;

export const STATUSES = [
  { value: "pending", label: "Pending", color: "warning" },
  { value: "reviewed", label: "Reviewed", color: "info" },
  { value: "escalated", label: "Escalated", color: "secondary" },
  { value: "resolved", label: "Resolved", color: "success" },
  { value: "rejected", label: "Closed", color: "default" },
] as const;

export type ReportStatus = (typeof STATUSES)[number]["value"];
export type StatusColor = (typeof STATUSES)[number]["color"];

/** English label for admin screens (the public site uses the translated messages) */
export const categoryLabel = (value?: string): string =>
  [...CATEGORIES, ...COMMENDATION_CATEGORIES].find((c) => c.value === value)?.label ?? "Other";

export const statusLabel = (value: string): string =>
  STATUSES.find((s) => s.value === value)?.label ?? value;

export const statusColor = (value: string): StatusColor =>
  STATUSES.find((s) => s.value === value)?.color ?? "default";
