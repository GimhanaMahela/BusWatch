import { Router, type RequestHandler } from "express";
import { SERVICE_CLASSES } from "../config/constants.js";
import * as fareController from "../controllers/fare.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { publicLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody, validateUuidParam } from "../middleware/validate.middleware.js";
import { fareRouteSchema, fareTableSchema } from "../validators/fare.validator.js";

// Fare checker: public lookups, and the admins' fare tables and route stops
const router = Router();
const validId = validateUuidParam("id");

const validServiceClass: RequestHandler = (req, res, next) => {
  if (!(SERVICE_CLASSES as readonly string[]).includes(String(req.params.serviceClass))) {
    res.status(404).json({ msg: "Unknown service class" });
    return;
  }
  next();
};

// --- Public ---
router.get("/routes", publicLimiter, fareController.getRoutes);
router.get("/routes/:id", publicLimiter, validId, fareController.getRoute);
router.get("/check", publicLimiter, fareController.check);

// --- Admin ---
router.get("/admin", requireAuth, fareController.getAdminOverview);
router.put(
  "/tables/:serviceClass",
  requireAuth,
  validServiceClass,
  validateBody(fareTableSchema),
  fareController.putTable,
);
router.post("/routes", requireAuth, validateBody(fareRouteSchema), fareController.createRoute);
router.put(
  "/routes/:id",
  requireAuth,
  validId,
  validateBody(fareRouteSchema),
  fareController.updateRoute,
);
router.delete("/routes/:id", requireAuth, validId, fareController.deleteRoute);

export default router;
