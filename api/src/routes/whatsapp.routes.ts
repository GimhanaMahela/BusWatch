import { Router } from "express";
import * as whatsappController from "../controllers/whatsapp.controller.js";

const router = Router();

router.get("/webhook", whatsappController.verify);
router.post("/webhook", whatsappController.webhook);

export default router;
