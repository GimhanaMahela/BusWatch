import { Router } from "express";
import authRoutes from "./auth.routes.js";
import metricRoutes from "./metric.routes.js";
import passengerRoutes from "./passenger.routes.js";
import publicRoutes from "./public.routes.js";
import pushRoutes from "./push.routes.js";
import reportRoutes from "./report.routes.js";
import storyRoutes from "./story.routes.js";

const router = Router();

router.use("/reports", reportRoutes);
router.use("/auth", authRoutes);
router.use("/metrics", metricRoutes);
router.use("/public", publicRoutes);
router.use("/stories", storyRoutes);
router.use("/passenger", passengerRoutes);
router.use("/push", pushRoutes);

export default router;
