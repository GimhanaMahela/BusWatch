import type { RequestHandler } from "express";
import { z } from "zod";

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

const uuidSchema = z.uuid();

/** 404s early when :id is not a valid UUID, so handlers (and Postgres) can trust it. */
export const validateUuidParam =
  (param = "id"): RequestHandler =>
  (req, res, next) => {
    if (!uuidSchema.safeParse(req.params[param]).success) {
      res.status(404).json({ msg: "Report not found" });
      return;
    }
    next();
  };
