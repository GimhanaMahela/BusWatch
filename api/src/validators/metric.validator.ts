import { z } from "zod";
import { CLIENT_METRIC_EVENTS } from "../config/constants.js";

export const recordEventSchema = z.object({
  event: z.enum(CLIENT_METRIC_EVENTS, { error: "Unknown event" }),
});

export type RecordEventInput = z.infer<typeof recordEventSchema>;
