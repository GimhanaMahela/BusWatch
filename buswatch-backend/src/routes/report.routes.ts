import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { submitLimiter, trackLimiter } from "../middleware/rate-limit.middleware.js";
import { reportMediaUpload } from "../middleware/upload.middleware.js";
import { validateBody, validateObjectIdParam } from "../middleware/validate.middleware.js";
import {
  addNoteSchema,
  submitReportSchema,
  updateStatusSchema,
} from "../validators/report.validator.js";

const router = Router();
const validId = validateObjectIdParam("id");

// --- Public ---
router.post(
  "/",
  submitLimiter,
  reportMediaUpload,
  validateBody(submitReportSchema),
  reportController.submitReport,
);
router.get("/track/:receiptId", trackLimiter, reportController.trackReport);

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
router.delete("/:id", requireAuth, validId, reportController.deleteReport);

export default router;
