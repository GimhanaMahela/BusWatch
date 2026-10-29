// Shared enums used by models, controllers and validation

const REPORT_STATUSES = [
  "pending",
  "reviewed",
  "escalated",
  "resolved",
  "rejected",
];

const REPORT_CATEGORIES = [
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
];

const ADMIN_ROLES = ["superadmin", "admin"];

module.exports = { REPORT_STATUSES, REPORT_CATEGORIES, ADMIN_ROLES };
