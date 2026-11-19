import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAccount, requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody, validateUuidParam } from "../middleware/validate.middleware.js";
import { loginSchema, registerAdminSchema } from "../validators/auth.validator.js";
import { updateFleetSchema } from "../validators/operator.validator.js";

const router = Router();

router.post("/login", loginLimiter, validateBody(loginSchema), authController.loginAdmin);
// Team members and operators both load their own profile
router.get("/", requireAccount, authController.getAdmin);

// --- Superadmin only ---
router.post(
  "/register",
  requireAuth,
  requireRole("superadmin"),
  validateBody(registerAdminSchema),
  authController.registerAdmin,
);
router.get("/admins", requireAuth, requireRole("superadmin"), authController.listAdmins);
router.put(
  "/admins/:id/fleet",
  requireAuth,
  requireRole("superadmin"),
  validateUuidParam("id"),
  validateBody(updateFleetSchema),
  authController.updateFleet,
);

export default router;
