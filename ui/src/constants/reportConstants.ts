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
  { value: "accessibility", label: "Accessibility (elderly / disabled)" },
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

/** "Lost something?" categories; "other" is shared */
export const LOST_ITEM_CATEGORIES = [
  { value: "bag", label: "Bag" },
  { value: "phone", label: "Phone" },
  { value: "wallet", label: "Wallet / purse" },
  { value: "documents", label: "Documents / ID" },
  { value: "keys", label: "Keys" },
  { value: "clothing", label: "Clothing / umbrella" },
  { value: "other", label: "Other" },
] as const;

export type ComplaintCategory = (typeof CATEGORIES)[number]["value"];
export type CommendationCategory = (typeof COMMENDATION_CATEGORIES)[number]["value"];
export type LostItemCategory = (typeof LOST_ITEM_CATEGORIES)[number]["value"];
export type ReportCategory = ComplaintCategory | CommendationCategory | LostItemCategory;

export const REPORT_TYPES = [
  { value: "complaint", label: "Complaint" },
  { value: "commendation", label: "Commendation" },
  { value: "lost_item", label: "Lost item" },
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

/** Reports count in public figures only once an admin has checked them (and not hidden them) */
export const PUBLIC_STATUSES = ["reviewed", "escalated", "resolved"] as const;
/** Keep in sync with MIN_PUBLIC_REPORTS in the API: the fairness threshold for scorecards */
export const MIN_PUBLIC_REPORTS = 3;

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
  [...CATEGORIES, ...COMMENDATION_CATEGORIES, ...LOST_ITEM_CATEGORIES].find(
    (c) => c.value === value,
  )?.label ?? "Other";

export const typeLabel = (value?: string): string =>
  REPORT_TYPES.find((t) => t.value === value)?.label ?? "Complaint";

// ---------------------------------------------------------------- Passenger safety (Phase 5)

/** Accessibility complaints: what went wrong (English labels for admin screens) */
export const ACCESSIBILITY_ISSUES = [
  { value: "priority_seat", label: "Priority seat not given up" },
  { value: "passed_by", label: "Bus didn't stop for an elderly or disabled passenger" },
  { value: "high_step", label: "Step too high / no ramp" },
  { value: "no_help_boarding", label: "No help getting on or off" },
  { value: "no_space_mobility_aid", label: "No room for a wheelchair, crutches or pram" },
  { value: "rushed", label: "Moved off before they were seated or off" },
] as const;
export type AccessibilityIssue = (typeof ACCESSIBILITY_ISSUES)[number]["value"];

/** Safety mode: what happened, on the quick harassment form */
export const SAFETY_KINDS = [
  { value: "verbal", label: "Comments or verbal abuse" },
  { value: "staring", label: "Staring" },
  { value: "touching", label: "Unwanted touching" },
  { value: "followed", label: "Followed" },
  { value: "filmed", label: "Photographed or filmed" },
  { value: "other", label: "Something else" },
] as const;
export type SafetyKind = (typeof SAFETY_KINDS)[number]["value"];

/** Fare checker service classes */
export const SERVICE_CLASSES = [
  { value: "normal", label: "Normal" },
  { value: "semi_luxury", label: "Semi-luxury" },
  { value: "luxury", label: "Luxury / A/C" },
] as const;
export type ServiceClass = (typeof SERVICE_CLASSES)[number]["value"];

export const accessibilityLabel = (value: string) =>
  ACCESSIBILITY_ISSUES.find((i) => i.value === value)?.label ?? value;
export const safetyKindLabel = (value: string) =>
  SAFETY_KINDS.find((k) => k.value === value)?.label ?? value;
export const serviceClassLabel = (value: string) =>
  SERVICE_CLASSES.find((c) => c.value === value)?.label ?? value;

export const statusLabel = (value: string): string =>
  STATUSES.find((s) => s.value === value)?.label ?? value;

export const statusColor = (value: string): StatusColor =>
  STATUSES.find((s) => s.value === value)?.color ?? "default";
