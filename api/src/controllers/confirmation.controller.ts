import { createHmac } from "node:crypto";
import type { Request, Response } from "express";
import type { PartOfDay } from "../config/constants.js";
import { env } from "../config/env.js";
import {
  addConfirmation,
  countConfirmations,
  findSimilarReports,
  isConfirmable,
} from "../repositories/confirmation.repository.js";
import { countEvent } from "../repositories/metric.repository.js";
import {
  similarQuerySchema,
  type ConfirmReportInput,
} from "../validators/confirmation.validator.js";

type IdParams = { id: string };

export const partOfDay = (hour: number | null): PartOfDay | null => {
  if (hour === null) return null;
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

/** One device = one IP address and browser. Keyed, so the stored value can't be reversed. */
const deviceHash = (req: Request) =>
  createHmac("sha256", env.JWT_SECRET)
    .update(`confirmation:${req.ip ?? ""}:${req.get("user-agent") ?? ""}`)
    .digest("hex");

// @desc    Complaints about the same bus, category and day ("Did you see this too?")
// @route   GET /api/reports/similar?busNumber&category&at
// @access  Public
export const findSimilar = async (req: Request, res: Response) => {
  const parsed = similarQuerySchema.safeParse(req.query);
  // Nothing to offer for odd input; the passenger just carries on with their report
  if (!parsed.success) {
    res.json({ matches: [] });
    return;
  }
  const { busNumber, category, at } = parsed.data;
  const rows = await findSimilarReports({ busNumber, category, at: at ?? new Date() });
  res.json({
    matches: rows.map(({ id, routeNumber, hour, confirmations }) => ({
      id,
      routeNumber,
      partOfDay: partOfDay(hour),
      confirmations,
    })),
  });
};

// @desc    Confirm another passenger's report ("Me too")
// @route   POST /api/reports/:id/confirmations
// @access  Public
export const confirmReport = async (
  req: Request<IdParams, object, ConfirmReportInput>,
  res: Response,
) => {
  const { id } = req.params;
  if (!(await isConfirmable(id))) {
    res.status(404).json({ msg: "This report can no longer be confirmed." });
    return;
  }
  const { comment, language, source } = req.body;
  const added = await addConfirmation({
    reportId: id,
    deviceHash: deviceHash(req as Request),
    comment,
    language,
    source,
  });
  if (!added) {
    res
      .status(409)
      .json({ msg: "You have already confirmed this report.", code: "already_confirmed" });
    return;
  }
  await countEvent("report_confirmed");
  res.status(201).json({ confirmations: await countConfirmations(id) });
};
