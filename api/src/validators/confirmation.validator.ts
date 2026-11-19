import { z } from "zod";
import {
  COMPLAINT_CATEGORIES,
  CONFIRMATION,
  LANGUAGES,
  WEB_REPORT_SOURCES,
} from "../config/constants.js";

const DAY_MS = 24 * 60 * 60 * 1000;
// Allow a few minutes of clock skew between the passenger's device and the server
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

/** GET /api/reports/similar?busNumber&category&at */
export const similarQuerySchema = z.object({
  busNumber: z.string().trim().min(1).max(20),
  category: z.enum(COMPLAINT_CATEGORIES),
  // When it happened (ISO timestamp); defaults to now
  at: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .date()
      .refine(
        (date) =>
          date.getTime() <= Date.now() + MAX_FUTURE_SKEW_MS &&
          date.getTime() >= Date.now() - (CONFIRMATION.maxAgeDays + 1) * DAY_MS,
      )
      .optional(),
  ),
});

export type SimilarQuery = z.infer<typeof similarQuerySchema>;

/** POST /api/reports/:id/confirmations */
export const confirmReportSchema = z.object({
  comment: z
    .string()
    .trim()
    .max(
      CONFIRMATION.maxCommentLength,
      `Keep it under ${CONFIRMATION.maxCommentLength} characters.`,
    )
    .optional()
    .transform((comment) => comment || undefined),
  language: z.enum(LANGUAGES).catch("en").default("en"),
  source: z.enum(WEB_REPORT_SOURCES).catch("web").default("web"),
  // Honeypot: hidden from people, filled in by bots
  website: z
    .string()
    .optional()
    .refine((value) => !value, { error: "Invalid submission." }),
});

export type ConfirmReportInput = z.infer<typeof confirmReportSchema>;
