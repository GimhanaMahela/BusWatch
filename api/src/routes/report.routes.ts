import { Router } from "express";
import * as messageController from "../controllers/message.controller.js";
import * as pushController from "../controllers/push.controller.js";
import * as reportController from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  messageLimiter,
  pushLimiter,
  rateLimiter,
  submitLimiter,
  trackLimiter,
} from "../middleware/rate-limit.middleware.js";
import { verifyTurnstile } from "../middleware/turnstile.middleware.js";
import { reportMediaUpload } from "../middleware/upload.middleware.js";
import { validateBody, validateUuidParam } from "../middleware/validate.middleware.js";
import {
  addNoteSchema,
  rateOutcomeSchema,
  submitReportSchema,
  updateStatusSchema,
} from "../validators/report.validator.js";
import {
  adminMessageSchema,
  passengerMessageSchema,
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} from "../validators/passenger.validator.js";
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
// Messages with the team, and browser push for this report
router.post(
  "/track/:receiptId/messages",
  messageLimiter,
  validateBody(passengerMessageSchema),
  messageController.sendPassengerMessage,
);
router.post("/track/:receiptId/messages/read", trackLimiter, messageController.markReadByPassenger);
router.post(
  "/track/:receiptId/push",
  pushLimiter,
  validateBody(pushSubscriptionSchema),
  pushController.subscribe,
);
router.post(
  "/track/:receiptId/push/unsubscribe",
  pushLimiter,
  validateBody(pushUnsubscribeSchema),
  pushController.unsubscribe,
);
router.post(
  "/track/:receiptId/push/status",
  pushLimiter,
  validateBody(pushUnsubscribeSchema),
  pushController.status,
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
router.post(
  "/:id/messages",
  requireAuth,
  validId,
  validateBody(adminMessageSchema),
  messageController.sendAdminMessage,
);
router.post("/:id/messages/read", requireAuth, validId, messageController.markReadByAdmin);
router.delete("/:id", requireAuth, validId, reportController.deleteReport);

export default router;
