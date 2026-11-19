import { Router } from "express";
import * as storyController from "../controllers/story.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody, validateUuidParam } from "../middleware/validate.middleware.js";
import { createStorySchema, updateStorySchema } from "../validators/story.validator.js";

const router = Router();
const validId = validateUuidParam("id");

router.use(requireAuth);
router.get("/", storyController.getStories);
router.post("/", validateBody(createStorySchema), storyController.createStory);
router.put("/:id", validId, validateBody(updateStorySchema), storyController.updateStory);
router.delete("/:id", validId, storyController.deleteStory);

export default router;
