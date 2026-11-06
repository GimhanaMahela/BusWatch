import { Router } from "express";
import * as pushController from "../controllers/push.controller.js";

const router = Router();

router.get("/key", pushController.getPushKey);

export default router;
