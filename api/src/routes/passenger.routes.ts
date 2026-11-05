import { Router } from "express";
import * as passengerController from "../controllers/passenger.controller.js";
import { requirePassenger } from "../middleware/auth.middleware.js";
import {
  codeLimiter,
  passengerLimiter,
  signInLimiter,
} from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { requestCodeSchema, verifyCodeSchema } from "../validators/passenger.validator.js";

// "My reports": passwordless sign-in with a one-time code, separate from the admin login
const router = Router();

router.get("/channels", passengerLimiter, passengerController.channels);
router.post("/code", codeLimiter, validateBody(requestCodeSchema), passengerController.requestCode);
router.post(
  "/session",
  signInLimiter,
  validateBody(verifyCodeSchema),
  passengerController.verifyCode,
);
router.get("/reports", passengerLimiter, requirePassenger, passengerController.myReports);

export default router;
