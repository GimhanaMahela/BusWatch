import { Router } from "express";
import * as operatorController from "../controllers/operator.controller.js";
import { requireOperator } from "../middleware/auth.middleware.js";
import { messageLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody, validateUuidParam } from "../middleware/validate.middleware.js";
import { operatorResponseSchema } from "../validators/operator.validator.js";

// Operator portal (Phase 4): every route is for signed-in bus operators only
const router = Router();
router.use(requireOperator);

router.get("/summary", operatorController.getSummary);
router.get("/reports", operatorController.listReports);
router.get("/reports/:id", validateUuidParam("id"), operatorController.getReport);
router.post(
  "/reports/:id/responses",
  messageLimiter,
  validateUuidParam("id"),
  validateBody(operatorResponseSchema),
  operatorController.respond,
);

export default router;
