import { Router } from "express";
import * as metricController from "../controllers/metric.controller.js";
import { metricsLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { recordEventSchema } from "../validators/metric.validator.js";

const router = Router();

router.post(
  "/events",
  metricsLimiter,
  validateBody(recordEventSchema),
  metricController.recordEvent,
);

export default router;
