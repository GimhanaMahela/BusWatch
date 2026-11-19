import { Router } from "express";
import * as tripController from "../controllers/trip.controller.js";
import { tripLimiter, tripPositionLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { startTripSchema, tripPositionSchema } from "../validators/trip.validator.js";

// "Share my trip" (safety mode): no account needed; the link and the phone's secret are the keys
const router = Router();

router.post("/", tripLimiter, validateBody(startTripSchema), tripController.start);
router.get("/:id", tripPositionLimiter, tripController.view);
router.put(
  "/:id/position",
  tripPositionLimiter,
  validateBody(tripPositionSchema),
  tripController.updatePosition,
);
router.post("/:id/end", tripLimiter, tripController.end);

export default router;
