import type { Request, Response } from "express";
import {
  createStory as createStoryRow,
  deleteStory as deleteStoryRow,
  listStories,
  updateStory as updateStoryRow,
} from "../repositories/story.repository.js";
import { invalidateCache } from "../utils/ttl-cache.js";
import type { CreateStoryInput, UpdateStoryInput } from "../validators/story.validator.js";

type IdParams = { id: string };

// Published stories appear on the cached /impact data; refresh it after any change
const refreshPublic = () => invalidateCache("public:");

// @desc    All resolved case stories, drafts included (Admin only)
// @route   GET /api/stories
// @access  Private (Admin)
export const getStories = async (_req: Request, res: Response) => {
  res.json(await listStories());
};

// @desc    Write a story (optionally publish it straight away)
// @route   POST /api/stories
// @access  Private (Admin)
export const createStory = async (
  req: Request<object, object, CreateStoryInput>,
  res: Response,
) => {
  const story = await createStoryRow({ ...req.body, createdBy: req.admin?.email });
  refreshPublic();
  res.status(201).json(story);
};

// @desc    Edit, publish or unpublish a story
// @route   PUT /api/stories/:id
// @access  Private (Admin)
export const updateStory = async (
  req: Request<IdParams, object, UpdateStoryInput>,
  res: Response,
) => {
  const story = await updateStoryRow(req.params.id, req.body);
  if (!story) {
    res.status(404).json({ msg: "Story not found" });
    return;
  }
  refreshPublic();
  res.json(story);
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private (Admin)
export const deleteStory = async (req: Request<IdParams>, res: Response) => {
  if (!(await deleteStoryRow(req.params.id))) {
    res.status(404).json({ msg: "Story not found" });
    return;
  }
  refreshPublic();
  res.json({ msg: "Story removed" });
};
