import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema, registerAdminSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/login", loginLimiter, validateBody(loginSchema), authController.loginAdmin);
router.get("/", requireAuth, authController.getAdmin);

// --- Superadmin only ---
router.post(
  "/register",
  requireAuth,
  requireRole("superadmin"),
  validateBody(registerAdminSchema),
  authController.registerAdmin,
);
router.get("/admins", requireAuth, requireRole("superadmin"), authController.listAdmins);

export default router;
