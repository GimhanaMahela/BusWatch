import { Router } from "express";
import * as aiController from "../controllers/ai.controller.js";
import * as confirmationController from "../controllers/confirmation.controller.js";
import * as messageController from "../controllers/message.controller.js";
import * as pushController from "../controllers/push.controller.js";
import * as reportController from "../controllers/report.controller.js";
import * as telegramController from "../controllers/telegram.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  aiLimiter,
  confirmLimiter,
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
  updateCategorySchema,
  updateStatusSchema,
} from "../validators/report.validator.js";
import { confirmReportSchema } from "../validators/confirmation.validator.js";
import {
  adminMessageSchema,
  expoPushSchema,
  passengerMessageSchema,
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} from "../validators/passenger.validator.js";
import { visibilitySchema } from "../validators/story.validator.js";
import { responseVisibilitySchema } from "../validators/operator.validator.js";

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
// The same for phones running the TransitX app (Expo push tokens)
router.post(
  "/track/:receiptId/app-push",
  pushLimiter,
  validateBody(expoPushSchema),
  pushController.subscribeApp,
);
router.post(
  "/track/:receiptId/app-push/unsubscribe",
  pushLimiter,
  validateBody(expoPushSchema),
  pushController.unsubscribeApp,
);
router.post(
  "/track/:receiptId/app-push/status",
  pushLimiter,
  validateBody(expoPushSchema),
  pushController.statusApp,
);
router.get("/track/:receiptId/telegram", pushLimiter, telegramController.followLink);
// "Me too": find a report about the same bus, category and day, and confirm it
router.get("/similar", trackLimiter, confirmationController.findSimilar);
router.post(
  "/:id/confirmations",
  confirmLimiter,
  validId,
  verifyTurnstile,
  validateBody(confirmReportSchema),
  confirmationController.confirmReport,
);

// --- Admin --- (specific paths stay above "/:id" so they are not treated as an ID)
router.get("/", requireAuth, reportController.getAllReports);
router.get("/stats", requireAuth, reportController.getStats);
router.get("/ai/status", requireAuth, aiController.status);
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
router.put(
  "/:id/operator-responses/:responseId",
  requireAuth,
  validId,
  validateUuidParam("responseId"),
  validateBody(responseVisibilitySchema),
  reportController.setOperatorResponseVisibility,
);
// AI help for admins
router.post("/:id/ai/analyse", requireAuth, validId, aiLimiter, aiController.analyse);
router.post("/:id/ai/blur", requireAuth, validId, aiLimiter, aiController.blur);
router.put(
  "/:id/category",
  requireAuth,
  validId,
  validateBody(updateCategorySchema),
  aiController.updateCategory,
);
router.delete("/:id", requireAuth, validId, reportController.deleteReport);

export default router;
