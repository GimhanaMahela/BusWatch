// Shared enums used by models, validators and controllers.
// Keep in sync with buswatch-frontend/src/constants/reportConstants.ts

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

export const REPORT_CATEGORIES = [
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
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const ADMIN_ROLES = ["superadmin", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const UPLOAD_LIMITS = {
  maxImages: 5,
  maxVideos: 2,
  maxFileBytes: 10 * 1024 * 1024,
} as const;
