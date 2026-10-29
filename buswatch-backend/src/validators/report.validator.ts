import { z } from "zod";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "../config/constants.js";

// Multipart forms send every field as a string; blank means "not provided"
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());

const optionalNumber = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional());

const requiredText = (field: string) =>
  z
    .string({ error: `${field} is required.` })
    .trim()
    .min(1, `${field} is required.`);

// Allow a few minutes of clock skew between the passenger's device and the server
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export const submitReportSchema = z
  .object({
    busNumber: requiredText("Bus Number"),
    routeNumber: requiredText("Route Number"),
    busName: optionalText,
    category: z.preprocess(
      blankToUndefined,
      z.enum(REPORT_CATEGORIES, { error: "Invalid incident category." }).default("other"),
    ),
    location: requiredText("Location"),
    description: requiredText("Description").max(
      5000,
      "Description must be 5000 characters or fewer.",
    ),
    passengerEmail: z.preprocess(
      blankToUndefined,
      z.email({ error: "Invalid email address." }).toLowerCase().optional(),
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
    // Honeypot: hidden from people, filled in by bots
    website: z.preprocess(
      blankToUndefined,
      z.undefined({ error: "Invalid submission." }).optional(),
    ),
  })
  .refine((data) => (data.latitude === undefined) === (data.longitude === undefined), {
    error: "Invalid map coordinates.",
    path: ["latitude"],
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
