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

/** "Commend good service" categories; "other" is shared with complaints */
export const COMMENDATION_CATEGORIES = [
  { value: "safe_driving", label: "Safe, careful driving" },
  { value: "helpful_staff", label: "Kind, polite and helpful" },
  { value: "helped_passenger", label: "Helped a passenger in need" },
  { value: "clean_vehicle", label: "Clean, well-kept bus" },
  { value: "on_time", label: "On time, every halt served" },
  { value: "fair_fare", label: "Correct fare and ticket" },
  { value: "comfortable_service", label: "Comfortable, well-run service" },
  { value: "other", label: "Other" },
] as const;

/** Who a commendation thanks (English labels for admin and operator screens) */
export const COMMENDEES = [
  { value: "driver", label: "The driver" },
  { value: "conductor", label: "The conductor" },
  { value: "crew", label: "The driver and conductor" },
  { value: "service", label: "The bus service as a whole" },
] as const;
export type Commendee = (typeof COMMENDEES)[number]["value"];

/** The reasons offered for each commendee, so a conductor isn't praised for their driving */
export const COMMENDATION_CATEGORIES_FOR: Record<Commendee, readonly string[]> = {
  driver: ["safe_driving", "helpful_staff", "helped_passenger", "on_time", "other"],
  conductor: ["helpful_staff", "helped_passenger", "fair_fare", "other"],
  crew: [
    "safe_driving",
    "helpful_staff",
    "helped_passenger",
    "on_time",
    "fair_fare",
    "clean_vehicle",
    "other",
  ],
  service: ["comfortable_service", "clean_vehicle", "on_time", "fair_fare", "other"],
};

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

/**
 * "Report a road incident": any vehicle on the road, or the road itself. "reckless_driving" and
 * "other" are shared with bus complaints.
 */
export const ROAD_INCIDENT_CATEGORIES = [
  { value: "reckless_driving", label: "Reckless / dangerous driving" },
  { value: "speeding", label: "Speeding" },
  { value: "drunk_driving", label: "Drunk driving" },
  { value: "red_light", label: "Jumping a red light" },
  { value: "wrong_side", label: "Driving on the wrong side" },
  { value: "dangerous_overtaking", label: "Dangerous overtaking" },
  { value: "phone_while_driving", label: "Phone use while driving" },
  { value: "no_helmet", label: "No helmet" },
  { value: "road_rage", label: "Road rage / threats" },
  { value: "unsafe_load", label: "Overloaded or unsecured load" },
  { value: "smoke_emission", label: "Black smoke" },
  { value: "noisy_exhaust", label: "Loud or modified exhaust" },
  { value: "illegal_parking", label: "Illegal parking / blocking the road" },
  { value: "hit_and_run", label: "Hit and run" },
  { value: "accident", label: "Accident" },
  { value: "road_hazard", label: "Road hazard" },
  { value: "other", label: "Other" },
] as const;

/** Road incidents about the road itself: no vehicle details are asked for */
export const ROAD_CATEGORIES_WITHOUT_VEHICLE: readonly string[] = ["road_hazard"];

export type ComplaintCategory = (typeof CATEGORIES)[number]["value"];
export type CommendationCategory = (typeof COMMENDATION_CATEGORIES)[number]["value"];
export type LostItemCategory = (typeof LOST_ITEM_CATEGORIES)[number]["value"];
export type RoadIncidentCategory = (typeof ROAD_INCIDENT_CATEGORIES)[number]["value"];
export type ReportCategory =
  ComplaintCategory | CommendationCategory | LostItemCategory | RoadIncidentCategory;

export const REPORT_TYPES = [
  { value: "complaint", label: "Complaint" },
  { value: "commendation", label: "Commendation" },
  { value: "lost_item", label: "Lost item" },
  { value: "road_incident", label: "Road incident" },
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
  [
    ...CATEGORIES,
    ...COMMENDATION_CATEGORIES,
    ...LOST_ITEM_CATEGORIES,
    ...ROAD_INCIDENT_CATEGORIES,
  ].find((c) => c.value === value)?.label ?? "Other";

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

// ---------------------------------------------------------------- Bus or other vehicle

/** Which kind of public transport bus (English labels for admin screens) */
export const BUS_SERVICES = [
  { value: "private", label: "Private bus" },
  { value: "sltb", label: "SLTB bus (government)" },
  { value: "metro", label: "Metro Bus" },
] as const;
export type BusService = (typeof BUS_SERVICES)[number]["value"];

// ---------------------------------------------------------------- Road incidents

/** Road incidents: the kind of vehicle (English labels for admin screens) */
export const VEHICLE_KINDS = [
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
  { value: "lorry", label: "Lorry / truck" },
  { value: "tipper", label: "Tipper / heavy vehicle" },
  { value: "three_wheeler", label: "Three-wheeler" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "private_bus", label: "Tour or staff bus (not on a route)" },
  { value: "school_van", label: "School van / bus" },
  { value: "taxi", label: "Taxi / ride-hailing car" },
  { value: "government", label: "Government vehicle" },
  { value: "tractor", label: "Tractor / farm vehicle" },
  { value: "unknown", label: "Not sure" },
] as const;
export type VehicleKind = (typeof VEHICLE_KINDS)[number]["value"];

/** Road accidents: was the passenger in it, or did they see it */
export const ACCIDENT_INVOLVEMENT = [
  { value: "involved", label: "I was involved" },
  { value: "witness", label: "I saw it happen" },
] as const;
export type AccidentInvolvement = (typeof ACCIDENT_INVOLVEMENT)[number]["value"];

/** Road accidents: how badly people were hurt */
export const INJURY_LEVELS = [
  { value: "none", label: "No one hurt" },
  { value: "minor", label: "Minor injuries" },
  { value: "serious", label: "Serious injuries" },
  { value: "unknown", label: "Not sure" },
] as const;
export type InjuryLevel = (typeof INJURY_LEVELS)[number]["value"];

/** Road hazards: what is wrong with the road */
export const ROAD_HAZARDS = [
  { value: "pothole", label: "Pothole / broken road" },
  { value: "broken_signal", label: "Traffic light not working" },
  { value: "streetlight_out", label: "Street lights out" },
  { value: "flooding", label: "Flooding" },
  { value: "fallen_tree", label: "Fallen tree or branch" },
  { value: "landslide", label: "Landslide / rocks on the road" },
  { value: "missing_sign", label: "Missing or damaged sign" },
  { value: "debris", label: "Debris or oil on the road" },
  { value: "animals", label: "Animals on the road" },
  { value: "other", label: "Something else" },
] as const;
export type RoadHazard = (typeof ROAD_HAZARDS)[number]["value"];

const labelOf =
  (list: readonly { value: string; label: string }[]) =>
  (value?: string | null): string =>
    list.find((item) => item.value === value)?.label ?? value ?? "";

export const vehicleKindLabel = labelOf(VEHICLE_KINDS);
export const involvementLabel = labelOf(ACCIDENT_INVOLVEMENT);
export const injuryLabel = labelOf(INJURY_LEVELS);
export const roadHazardLabel = labelOf(ROAD_HAZARDS);
export const busServiceLabel = labelOf(BUS_SERVICES);
export const commendeeLabel = labelOf(COMMENDEES);

/** Keep in sync with ROAD_INCIDENT in the API */
export const ROAD_INCIDENT = { maxPlateLength: 15, maxVehicleText: 40, maxVehiclesInvolved: 20 };
