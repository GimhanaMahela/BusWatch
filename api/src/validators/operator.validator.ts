import { z } from "zod";
import {
  MAX_FLEET_SIZE,
  MAX_OPERATOR_RESPONSE_LENGTH,
  OPERATOR_LOST_ITEM_STATUSES,
  REPORT_TYPES,
} from "../config/constants.js";

export const fleetReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  status: z.enum(OPERATOR_LOST_ITEM_STATUSES).optional().catch(undefined),
  type: z.enum(REPORT_TYPES).optional().catch(undefined),
  busNumber: z.string().trim().max(20).optional().catch(undefined),
});

export type FleetReportsQuery = z.infer<typeof fleetReportsQuerySchema>;

export const operatorResponseSchema = z.object({
  body: z
    .string({ error: "Write what you did about this report." })
    .trim()
    .min(1, "Write what you did about this report.")
    .max(MAX_OPERATOR_RESPONSE_LENGTH, `Keep it under ${MAX_OPERATOR_RESPONSE_LENGTH} characters.`),
});

export type OperatorResponseInput = z.infer<typeof operatorResponseSchema>;

/** Bus numbers typed by a superadmin: one per line, or separated by commas. */
export const busNumberList = z
  .array(z.string().trim().min(1).max(20, "Bus numbers are at most 20 characters."))
  .max(MAX_FLEET_SIZE, `An operator can have at most ${MAX_FLEET_SIZE} buses.`);

export const updateFleetSchema = z.object({
  busNumbers: busNumberList,
  organisation: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || null),
});

export type UpdateFleetInput = z.infer<typeof updateFleetSchema>;

export const responseVisibilitySchema = z.object({
  hidden: z.boolean({ error: "hidden must be true or false" }),
});

export type ResponseVisibilityInput = z.infer<typeof responseVisibilitySchema>;

/** Operator portal: "We found it" on a lost item, with where to collect it */
export const lostItemFoundSchema = z.object({
  body: z
    .string({ error: "Say where the passenger can collect it." })
    .trim()
    .min(1, "Say where the passenger can collect it.")
    .max(MAX_OPERATOR_RESPONSE_LENGTH, `Keep it under ${MAX_OPERATOR_RESPONSE_LENGTH} characters.`),
});

export type LostItemFoundInput = z.infer<typeof lostItemFoundSchema>;
