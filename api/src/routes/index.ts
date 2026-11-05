import { Router } from "express";
import authRoutes from "./auth.routes.js";
import metricRoutes from "./metric.routes.js";
import publicRoutes from "./public.routes.js";
import reportRoutes from "./report.routes.js";
import storyRoutes from "./story.routes.js";

const router = Router();

router.use("/reports", reportRoutes);
router.use("/auth", authRoutes);
router.use("/metrics", metricRoutes);
router.use("/public", publicRoutes);
router.use("/stories", storyRoutes);

export default router;
