import { Router } from "express";
import assistantRoutes from "./assistant.routes.js";
import authRoutes from "./auth.routes.js";
import fareRoutes from "./fare.routes.js";
import metricRoutes from "./metric.routes.js";
import operatorRoutes from "./operator.routes.js";
import passengerRoutes from "./passenger.routes.js";
import publicRoutes from "./public.routes.js";
import pushRoutes from "./push.routes.js";
import reportRoutes from "./report.routes.js";
import storyRoutes from "./story.routes.js";
import telegramRoutes from "./telegram.routes.js";
import tripRoutes from "./trip.routes.js";
import whatsappRoutes from "./whatsapp.routes.js";

const router = Router();

router.use("/reports", reportRoutes);
router.use("/auth", authRoutes);
router.use("/metrics", metricRoutes);
router.use("/public", publicRoutes);
router.use("/stories", storyRoutes);
router.use("/passenger", passengerRoutes);
router.use("/push", pushRoutes);
router.use("/telegram", telegramRoutes);
router.use("/operator", operatorRoutes);
router.use("/assistant", assistantRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/fares", fareRoutes);
router.use("/trips", tripRoutes);

export default router;
