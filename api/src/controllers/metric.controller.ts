import type { Request, Response } from "express";
import { incrementMetric } from "../repositories/metric.repository.js";
import type { RecordEventInput } from "../validators/metric.validator.js";

// @desc    Count an anonymous usage event (form started, tracking page viewed, QR scanned, ...)
// @route   POST /api/metrics/events
// @access  Public
export const recordEvent = async (
  req: Request<object, object, RecordEventInput>,
  res: Response,
) => {
  await incrementMetric(req.body.event);
  res.status(204).end();
};
