import { Router } from "express";
import * as telegramController from "../controllers/telegram.controller.js";

const router = Router();

router.post("/webhook", telegramController.webhook);

export default router;
