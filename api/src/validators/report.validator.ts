import { z } from "zod";
import {
  ACCESSIBILITY_ISSUES,
  ACCIDENT_INVOLVEMENT,
  BUS_SERVICES,
  CATEGORIES_BY_TYPE,
  COMMENDEES,
  COMPLAINT_CATEGORIES,
  INJURY_LEVELS,
  ROAD_CATEGORIES_WITHOUT_VEHICLE,
  ROAD_HAZARDS,
  ROAD_INCIDENT,
  VEHICLE_KINDS,
  type ReportCategory,
  FARES,
  SAFETY_KINDS,
  SERVICE_CLASSES,
  LANGUAGES,
  REPORT_CATEGORIES,
  WEB_REPORT_SOURCES,
  REPORT_STATUSES,
  REPORT_TYPES,
} from "../config/constants.js";
import { normalisePhone } from "../utils/phone.js";

// Multipart forms send every field as a string; blank means "not provided"
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());

const optionalNumber = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional());

const optionalShortText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable().default(null),
  );

/** A road incident's vehicle, accident or hazard (checked against the category below). */
const roadDetailsSchema = z
  .object({
    vehicle: z
      .object({
        kind: z.enum(VEHICLE_KINDS, { error: "Choose the kind of vehicle." }),
        // Plates are written many ways ("WP CAB-1234", "65-1234"); keep it tidy, not strict
        plate: optionalShortText(ROAD_INCIDENT.maxPlateLength).transform((plate) =>
          plate ? plate.toUpperCase().replace(/\s+/g, " ") : null,
        ),
        colour: optionalShortText(ROAD_INCIDENT.maxVehicleText),
        make: optionalShortText(ROAD_INCIDENT.maxVehicleText),
      })
      .strict()
      .optional(),
    accident: z
      .object({
        involvement: z.enum(ACCIDENT_INVOLVEMENT, { error: "Say whether you were in it." }),
        injuries: z.enum(INJURY_LEVELS).default("unknown"),
        vehiclesInvolved: z
          .number()
          .int()
          .min(1)
          .max(ROAD_INCIDENT.maxVehiclesInvolved)
          .nullable()
          .default(null),
      })
      .strict()
      .optional(),
    hazard: z.enum(ROAD_HAZARDS, { error: "Choose what is wrong with the road." }).optional(),
    extraHazards: z
      .array(z.enum(ROAD_HAZARDS, { error: "Choose what is wrong with the road." }))
      .max(ROAD_HAZARDS.length)
      .optional(),
  })
  .strict()
  .refine((road) => !road.extraHazards?.length || road.hazard, {
    error: "Choose what is wrong with the road.",
  })
  // Without the main one repeated or duplicates; dropped when empty
  .transform(({ extraHazards, ...road }) => {
    const extras = [...new Set(extraHazards)].filter((h) => h !== road.hazard);
    return extras.length ? { ...road, extraHazards: extras } : road;
  });

const roadNeedsVehicle = (category: ReportCategory) =>
  !(ROAD_CATEGORIES_WITHOUT_VEHICLE as readonly ReportCategory[]).includes(category);

/**
 * Structured extras for some categories. Multipart forms send them as one JSON string. The fare is
 * only the passenger's choice of route, stops and class: the server looks up the official fare.
 */
export const reportDetailsSchema = z
  .object({
    accessibility: z
      .array(z.enum(ACCESSIBILITY_ISSUES, { error: "Invalid accessibility issue." }))
      .min(1, "Tick what went wrong.")
      .max(ACCESSIBILITY_ISSUES.length)
      .transform((issues) => [...new Set(issues)])
      .optional(),
    fare: z
      .object({
        routeId: z.uuid({ error: "Choose the route again." }),
        from: z.number().int().min(0).max(FARES.maxStops),
        to: z.number().int().min(0).max(FARES.maxStops),
        serviceClass: z.enum(SERVICE_CLASSES).default("normal"),
        charged: z.number().int().min(0).max(FARES.maxFare).optional(),
      })
      .optional(),
    safety: z
      .object({
        kinds: z
          .array(z.enum(SAFETY_KINDS))
          .max(SAFETY_KINDS.length)
          .transform((kinds) => [...new Set(kinds)]),
      })
      .optional(),
    road: roadDetailsSchema.optional(),
    commendee: z.enum(COMMENDEES, { error: "Choose who you are thanking." }).optional(),
  })
  .strict();

export type ReportDetailsInput = z.infer<typeof reportDetailsSchema>;

const parseJson = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value; // left as a string, so the schema reports it as invalid
  }
};

/**
 * The other incident types on a complaint. Multipart forms send them as one comma-separated
 * string ("harassment,loud_music"); JSON clients may send an array. Duplicates are dropped.
 */
const extraCategoriesSchema = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
      : value,
  z
    .array(z.enum(REPORT_CATEGORIES, { error: "Invalid incident category." }))
    .max(COMPLAINT_CATEGORIES.length)
    .transform((categories) => [...new Set(categories)])
    .default([]),
);

/** Every incident type on the report: the main one, then the extras. */
const allCategories = (data: { category: ReportCategory; extraCategories: ReportCategory[] }) => [
  data.category,
  ...data.extraCategories,
];

// Allow a few minutes of clock skew between the passenger's device and the server
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export const submitReportSchema = z
  .object({
    type: z.preprocess(
      blankToUndefined,
      z.enum(REPORT_TYPES, { error: "Invalid report type." }).default("complaint"),
    ),
    // Required for every report about a route bus; road incidents are about any vehicle (the
    // plate goes in details.road) and are stored with these empty
    busNumber: optionalText.pipe(
      z.string().max(20, "Bus Number must be 20 characters or fewer.").optional(),
    ),
    routeNumber: optionalText.pipe(
      z.string().max(60, "Route Number must be 60 characters or fewer.").optional(),
    ),
    busName: optionalText,
    // Private, SLTB or Metro Bus (the web form asks; older clients and the WhatsApp bot don't)
    busService: z.preprocess(
      blankToUndefined,
      z.enum(BUS_SERVICES, { error: "Choose the kind of bus." }).optional(),
    ),
    category: z.preprocess(
      blankToUndefined,
      z.enum(REPORT_CATEGORIES, { error: "Invalid incident category." }).default("other"),
    ),
    // Complaints only: anything else that happened, besides the main category
    extraCategories: extraCategoriesSchema,
    // Required for complaints (checked below); optional for a commendation, for a lost item
    // and on the quick safety-mode form
    location: optionalText,
    // Required, except on the quick safety-mode form (the ticked boxes say what happened)
    description: z.preprocess(
      blankToUndefined,
      z.string().trim().max(5000, "Description must be 5000 characters or fewer.").optional(),
    ),
    details: z.preprocess(
      (value) => parseJson(blankToUndefined(value)),
      reportDetailsSchema.optional(),
    ),
    passengerEmail: z.preprocess(
      blankToUndefined,
      z.email({ error: "Invalid email address." }).toLowerCase().optional(),
    ),
    // Optional mobile number for SMS updates and "My reports"; stored as +94771234567
    passengerPhone: z.preprocess(
      blankToUndefined,
      z
        .string()
        .max(30)
        .transform((value, ctx) => {
          const phone = normalisePhone(value);
          if (phone) return phone;
          ctx.addIssue({ code: "custom", message: "Enter a mobile number like 077 123 4567." });
          return z.NEVER;
        })
        .optional(),
    ),
    incidentAt: z.preprocess(
      blankToUndefined,
      z.coerce
        .date({ error: "Incident date/time is invalid or in the future." })
        .refine((date) => date.getTime() <= Date.now() + MAX_FUTURE_SKEW_MS, {
          error: "Incident date/time is invalid or in the future.",
        })
        .optional(),
    ),
    latitude: optionalNumber(-90, 90),
    longitude: optionalNumber(-180, 180),
    // The passenger's site language: their receipt and later emails use it
    language: z.preprocess(blankToUndefined, z.enum(LANGUAGES).catch("en").default("en")),
    // "qr" when the form was opened from the QR sticker inside the bus
    source: z.preprocess(blankToUndefined, z.enum(WEB_REPORT_SOURCES).catch("web").default("web")),
    // Honeypot: hidden from people, filled in by bots
    website: z.preprocess(
      blankToUndefined,
      z.undefined({ error: "Invalid submission." }).optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === "road_incident") return;
    if (!data.busNumber) {
      ctx.addIssue({ code: "custom", message: "Bus Number is required.", path: ["busNumber"] });
    }
    if (!data.routeNumber) {
      ctx.addIssue({ code: "custom", message: "Route Number is required.", path: ["routeNumber"] });
    }
  })
  .refine((data) => (data.latitude === undefined) === (data.longitude === undefined), {
    error: "Invalid map coordinates.",
    path: ["latitude"],
  })
  .refine(
    (data) =>
      (data.type !== "complaint" && data.type !== "road_incident") ||
      data.details?.safety ||
      data.location !== undefined,
    { error: "Location is required.", path: ["location"] },
  )
  .refine((data) => data.details?.safety || data.description !== undefined, {
    error: "Description is required.",
    path: ["description"],
  })
  .refine((data) => CATEGORIES_BY_TYPE[data.type].includes(data.category), {
    error: "Invalid incident category.",
    path: ["category"],
  })
  .refine(
    (data) =>
      data.extraCategories.length === 0 ||
      (data.type === "complaint" &&
        data.extraCategories.every((c) => CATEGORIES_BY_TYPE.complaint.includes(c))),
    { error: "Invalid incident category.", path: ["extraCategories"] },
  )
  // Someone has to be able to tell the passenger their bag was found
  .refine(
    (data) =>
      data.type !== "lost_item" ||
      data.passengerEmail !== undefined ||
      data.passengerPhone !== undefined,
    {
      error: "Give an email address or mobile number so we can tell you if it is found.",
      path: ["passengerEmail"],
    },
  )
  // Each extra belongs to one kind of complaint
  .refine(
    (data) =>
      (data.type === "complaint" && allCategories(data).includes("accessibility")) ===
      Boolean(data.details?.accessibility),
    { error: "Tick what went wrong.", path: ["details"] },
  )
  .refine(
    (data) =>
      !data.details?.fare ||
      (data.type === "complaint" && allCategories(data).includes("overcharging")),
    { error: "Fare details only go with an overcharging complaint.", path: ["details"] },
  )
  .refine(
    (data) =>
      !data.details?.safety ||
      (data.type === "complaint" && allCategories(data).includes("harassment")),
    { error: "Invalid submission.", path: ["details"] },
  )
  .refine((data) => !data.details?.commendee || data.type === "commendation", {
    error: "Invalid submission.",
    path: ["details"],
  })
  // Road incidents: a vehicle unless it is about the road itself, an accident's details only for
  // an accident, and what is wrong only for a road hazard
  .superRefine((data, ctx) => {
    const road = data.details?.road;
    if (data.type !== "road_incident") {
      if (road) ctx.addIssue({ code: "custom", message: "Invalid submission.", path: ["details"] });
      return;
    }
    const issue = (message: string) => ctx.addIssue({ code: "custom", message, path: ["details"] });
    if (roadNeedsVehicle(data.category) !== Boolean(road?.vehicle)) {
      issue(
        roadNeedsVehicle(data.category) ? "Choose the kind of vehicle." : "Invalid submission.",
      );
    }
    if ((data.category === "accident") !== Boolean(road?.accident)) {
      issue(data.category === "accident" ? "Say whether you were in it." : "Invalid submission.");
    }
    if ((data.category === "road_hazard") !== Boolean(road?.hazard)) {
      issue(
        data.category === "road_hazard"
          ? "Choose what is wrong with the road."
          : "Invalid submission.",
      );
    }
  });

export type SubmitReportInput = z.infer<typeof submitReportSchema>;

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  status: z
    .enum([...REPORT_STATUSES, "open"])
    .optional()
    .catch(undefined),
  category: z.enum(REPORT_CATEGORIES).optional().catch(undefined),
  type: z.enum(REPORT_TYPES).optional().catch(undefined),
  q: z.string().trim().optional().catch(undefined),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

export const updateStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES, { error: "Invalid status" }),
  note: z
    .string()
    .trim()
    .max(2000, "Message must be 2000 characters or fewer")
    .optional()
    .transform((note) => note || undefined),
  notifyPassenger: z.boolean().default(true),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const addNoteSchema = z.object({
  text: z
    .string({ error: "Note text is required" })
    .trim()
    .min(1, "Note text is required")
    .max(2000, "Note must be 2000 characters or fewer"),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const rateOutcomeSchema = z.object({
  rating: z.coerce
    .number({ error: "Choose a rating from 1 to 5." })
    .int("Choose a rating from 1 to 5.")
    .min(1, "Choose a rating from 1 to 5.")
    .max(5, "Choose a rating from 1 to 5."),
  feedback: z
    .string()
    .trim()
    .max(1000, "Feedback must be 1000 characters or fewer.")
    .optional()
    .transform((feedback) => feedback || undefined),
});

export type RateOutcomeInput = z.infer<typeof rateOutcomeSchema>;

export const updateCategorySchema = z.object({
  category: z.enum(REPORT_CATEGORIES, { error: "Invalid category." }),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
