import { z } from "zod";
import { FARES, SERVICE_CLASSES } from "../config/constants.js";

const fare = z
  .number({ error: "Fares must be whole rupees." })
  .int("Fares must be whole rupees.")
  .min(1, "Fares must be at least Rs. 1.")
  .max(FARES.maxFare, `Fares must be at most Rs. ${FARES.maxFare}.`);

/** The NTC fare-stage table for one service class: fares[0] is one stage, fares[1] two, … */
export const fareTableSchema = z.object({
  fares: z
    .array(fare)
    .min(1, "Enter at least the minimum fare.")
    .max(FARES.maxStages, `A fare table can have at most ${FARES.maxStages} stages.`)
    .refine((fares) => fares.every((value, i) => i === 0 || value >= (fares[i - 1] ?? 0)), {
      error: "Each stage must cost at least as much as the one before.",
    }),
  effectiveFrom: z.iso
    .date({ error: "Use a date like 2026-07-01." })
    .optional()
    .or(z.literal("").transform(() => undefined))
    .optional(),
});

export type FareTableInput = z.infer<typeof fareTableSchema>;

export const fareRouteSchema = z.object({
  routeNumber: z
    .string({ error: "Route number is required." })
    .trim()
    .min(1, "Route number is required.")
    .max(60, "Route number must be 60 characters or fewer."),
  name: z
    .string({ error: "Route name is required." })
    .trim()
    .min(1, "Route name is required.")
    .max(120, "Route name must be 120 characters or fewer."),
  serviceClasses: z
    .array(z.enum(SERVICE_CLASSES))
    .min(1, "Choose at least one service class.")
    .transform((classes) => [...new Set(classes)]),
  stops: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Every stop needs a name.").max(80),
        stage: z.number().int().min(0).max(FARES.maxStages),
      }),
    )
    .min(2, "A route needs at least two stops.")
    .max(FARES.maxStops, `A route can have at most ${FARES.maxStops} stops.`),
});

export type FareRouteInput = z.infer<typeof fareRouteSchema>;

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const fareCheckQuerySchema = z.object({
  routeId: z.uuid({ error: "Choose a route." }),
  from: z.coerce.number().int().min(0).max(FARES.maxStops),
  to: z.coerce.number().int().min(0).max(FARES.maxStops),
  serviceClass: z.preprocess(blankToUndefined, z.enum(SERVICE_CLASSES).default("normal")),
  charged: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(0).max(FARES.maxFare).optional(),
  ),
});

export type FareCheckQuery = z.infer<typeof fareCheckQuerySchema>;
