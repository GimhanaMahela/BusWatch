import { Router } from "express";
import * as assistantController from "../controllers/assistant.controller.js";
import { assistantLimiter, emergencyLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { chatSchema, emergencyCheckSchema } from "../validators/assistant.validator.js";

// The TransitX helper chat on the public site (no account needed)
const router = Router();

router.get("/status", assistantController.status);
router.post("/chat", assistantLimiter, validateBody(chatSchema), assistantController.chat);

router.post(
  "/emergency",
  emergencyLimiter,
  validateBody(emergencyCheckSchema),
  assistantController.emergency,
);

export default router;
