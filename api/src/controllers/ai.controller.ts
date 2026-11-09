import Anthropic from "@anthropic-ai/sdk";
import type { Request, Response } from "express";
import { CATEGORIES_BY_TYPE } from "../config/constants.js";
import { countEvent } from "../repositories/metric.repository.js";
import { findOperatorsForBus } from "../repositories/operator.repository.js";
import {
  findReportById,
  setAiInsights,
  setBlurredImages,
  setReportCategory,
  type ReportWithRelations,
} from "../repositories/report.repository.js";
import {
  AiUnavailableError,
  analyseReport,
  blurImages,
  isAiConfigured,
} from "../services/ai.service.js";
import type { UpdateCategoryInput } from "../validators/report.validator.js";

type IdParams = { id: string };

/** The admin view of a report, as GET /api/reports/:id returns it. */
const adminView = async (report: ReportWithRelations) => ({
  ...report,
  operators: await findOperatorsForBus(report.busNumber),
});

/** Turns AI failures into a clear message for the admin instead of a 500. */
const sendAiError = (res: Response, error: unknown) => {
  if (error instanceof AiUnavailableError) {
    res.status(503).json({ msg: error.message });
    return;
  }
  if (error instanceof Anthropic.RateLimitError) {
    res.status(503).json({ msg: "The AI service is busy. Try again in a minute." });
    return;
  }
  if (error instanceof Anthropic.APIError) {
    console.error("AI request failed:", error.status, error.message);
    res.status(502).json({ msg: "The AI service could not help with this report right now." });
    return;
  }
  throw error;
};

// @desc    Is AI help switched on?
// @route   GET /api/reports/ai/status
// @access  Private (Admin)
export const status = (_req: Request, res: Response) => {
  res.json({ enabled: isAiConfigured() });
};

// @desc    Suggest a category, translate and summarise a report
// @route   POST /api/reports/:id/ai/analyse
// @access  Private (Admin)
export const analyse = async (req: Request<IdParams>, res: Response) => {
  const report = await findReportById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  try {
    await setAiInsights(report.id, await analyseReport(report));
  } catch (error) {
    sendAiError(res, error);
    return;
  }
  await countEvent("ai_analysis");
  const updated = await findReportById(report.id);
  if (!updated) throw new Error("Report disappeared during AI analysis");
  res.json(await adminView(updated));
};

// @desc    Blur faces and number plates in the report's photos
// @route   POST /api/reports/:id/ai/blur
// @access  Private (Admin)
export const blur = async (req: Request<IdParams>, res: Response) => {
  const report = await findReportById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  if (report.images.length === 0) {
    res.status(400).json({ msg: "This report has no photos." });
    return;
  }
  let regions: number;
  try {
    const result = await blurImages(report.images);
    regions = result.regions;
    await setBlurredImages(report.id, result.urls);
  } catch (error) {
    sendAiError(res, error);
    return;
  }
  await countEvent("ai_blur");
  const updated = await findReportById(report.id);
  if (!updated) throw new Error("Report disappeared while blurring photos");
  res.json({ ...(await adminView(updated)), blurredRegions: regions });
};

// @desc    Change a report's category (e.g. to the AI suggestion)
// @route   PUT /api/reports/:id/category
// @access  Private (Admin)
export const updateCategory = async (
  req: Request<IdParams, object, UpdateCategoryInput>,
  res: Response,
) => {
  const report = await findReportById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  if (!CATEGORIES_BY_TYPE[report.type].includes(req.body.category)) {
    res.status(400).json({ msg: "That category doesn't fit this kind of report." });
    return;
  }
  await setReportCategory(report.id, req.body.category);
  const updated = await findReportById(report.id);
  if (!updated) throw new Error("Report disappeared while changing its category");
  res.json(await adminView(updated));
};

/** After a report is submitted (AI_AUTO_ANALYSE): best-effort, never fails the submission. */
export const analyseInBackground = (
  report: Parameters<typeof analyseReport>[0] & { id: string },
) => {
  if (!isAiConfigured()) return;
  void analyseReport(report)
    .then((insights) => setAiInsights(report.id, insights))
    .then(() => countEvent("ai_analysis"))
    .catch((error: unknown) =>
      console.error(
        "Automatic AI analysis failed:",
        error instanceof Error ? error.message : error,
      ),
    );
};
