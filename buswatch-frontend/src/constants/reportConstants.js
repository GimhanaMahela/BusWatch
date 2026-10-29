// Keep in sync with buswatch-backend/config/constants.js

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
];

export const STATUSES = [
  { value: "pending", label: "Pending", color: "warning" },
  { value: "reviewed", label: "Reviewed", color: "info" },
  { value: "escalated", label: "Escalated", color: "secondary" },
  { value: "resolved", label: "Resolved", color: "success" },
  { value: "rejected", label: "Closed", color: "default" },
];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || "Other";

export const statusLabel = (value) =>
  STATUSES.find((s) => s.value === value)?.label || value;

export const statusColor = (value) =>
  STATUSES.find((s) => s.value === value)?.color || "default";
