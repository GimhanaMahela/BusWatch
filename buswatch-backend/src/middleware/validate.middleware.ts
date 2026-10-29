import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import type { z } from "zod";

/**
 * Validates req.body against a Zod schema and replaces it with the parsed
 * (trimmed, coerced, defaulted) value. Responds 400 with the first problem.
 */
export const validateBody =
  (schema: z.ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      res.status(400).json({ message: errors[0], msg: errors[0], errors });
      return;
    }
    req.body = result.data;
    next();
  };

/** 404s early when :id is not a valid ObjectId, so handlers can trust it. */
export const validateObjectIdParam =
  (param = "id"): RequestHandler =>
  (req, res, next) => {
    if (!isValidObjectId(req.params[param])) {
      res.status(404).json({ msg: "Report not found" });
      return;
    }
    next();
  };
