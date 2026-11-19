import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const startTripSchema = z.object({
  busNumber: optionalText(20),
  routeNumber: optionalText(60),
});

export type StartTripInput = z.infer<typeof startTripSchema>;

export const tripPositionSchema = z.object({
  latitude: z.number({ error: "Invalid position." }).min(-90).max(90),
  longitude: z.number({ error: "Invalid position." }).min(-180).max(180),
  accuracy: z.number().min(0).max(100_000).optional(),
});

export type TripPositionInput = z.infer<typeof tripPositionSchema>;
