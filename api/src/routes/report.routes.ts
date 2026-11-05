import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { rateLimiter, submitLimiter, trackLimiter } from "../middleware/rate-limit.middleware.js";
import { verifyTurnstile } from "../middleware/turnstile.middleware.js";
import { reportMediaUpload } from "../middleware/upload.middleware.js";
import { validateBody, validateUuidParam } from "../middleware/validate.middleware.js";
import {
  addNoteSchema,
  rateOutcomeSchema,
  submitReportSchema,
  updateStatusSchema,
} from "../validators/report.validator.js";
import { visibilitySchema } from "../validators/story.validator.js";

const router = Router();
const validId = validateUuidParam("id");

// --- Public ---
router.post(
  "/",
  submitLimiter,
  reportMediaUpload,
  verifyTurnstile,
  validateBody(submitReportSchema),
  reportController.submitReport,
);
router.get("/track/:receiptId", trackLimiter, reportController.trackReport);
router.post(
  "/track/:receiptId/rating",
  rateLimiter,
  validateBody(rateOutcomeSchema),
  reportController.rateOutcome,
);

// --- Admin --- (specific paths stay above "/:id" so they are not treated as an ID)
router.get("/", requireAuth, reportController.getAllReports);
router.get("/stats", requireAuth, reportController.getStats);
router.get("/receipt/:receiptId", requireAuth, reportController.getReportByReceiptId);
router.get("/:id", requireAuth, validId, reportController.getReportById);
router.put(
  "/:id/status",
  requireAuth,
  validId,
  validateBody(updateStatusSchema),
  reportController.updateReportStatus,
);
router.post(
  "/:id/notes",
  requireAuth,
  validId,
  validateBody(addNoteSchema),
  reportController.addNote,
);
router.put(
  "/:id/visibility",
  requireAuth,
  validId,
  validateBody(visibilitySchema),
  reportController.setVisibility,
);
router.delete("/:id", requireAuth, validId, reportController.deleteReport);

export default router;
