import { Router } from "express";
import * as publicController from "../controllers/public.controller.js";
import { publicLimiter } from "../middleware/rate-limit.middleware.js";

// Read-only, aggregated and cached: everything here is safe to show anyone
const router = Router();

router.use(publicLimiter);
router.get("/stats", publicController.getImpact);
router.get("/buses/:busNumber", publicController.getBus);
router.get("/routes/:routeNumber", publicController.getRoute);

export default router;
