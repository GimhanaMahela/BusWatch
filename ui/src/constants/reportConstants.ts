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

export type ReportCategory = (typeof CATEGORIES)[number]["value"];

export const STATUSES = [
  { value: "pending", label: "Pending", color: "warning" },
  { value: "reviewed", label: "Reviewed", color: "info" },
  { value: "escalated", label: "Escalated", color: "secondary" },
  { value: "resolved", label: "Resolved", color: "success" },
  { value: "rejected", label: "Closed", color: "default" },
] as const;

export type ReportStatus = (typeof STATUSES)[number]["value"];
export type StatusColor = (typeof STATUSES)[number]["color"];

export const categoryLabel = (value?: string): string =>
  CATEGORIES.find((c) => c.value === value)?.label ?? "Other";

export const statusLabel = (value: string): string =>
  STATUSES.find((s) => s.value === value)?.label ?? value;

export const statusColor = (value: string): StatusColor =>
  STATUSES.find((s) => s.value === value)?.color ?? "default";
