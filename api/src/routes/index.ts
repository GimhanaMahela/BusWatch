import { Router } from "express";
import authRoutes from "./auth.routes.js";
import reportRoutes from "./report.routes.js";

const router = Router();

router.use("/reports", reportRoutes);
router.use("/auth", authRoutes);

export default router;
