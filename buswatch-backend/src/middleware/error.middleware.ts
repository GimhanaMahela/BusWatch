import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ msg: "Not found" });
};

const MULTER_MESSAGES: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: "Each file must be 10MB or smaller.",
  LIMIT_FILE_COUNT: "Too many files. Upload at most 5 images and 2 videos.",
};

// Express 5 forwards rejected promises from async handlers here too
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      message: MULTER_MESSAGES[err.code] ?? err.message ?? "Unexpected file upload.",
      field: err.field,
    });
    return;
  }
  if (err && typeof err === "object" && "type" in err && err.type === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large." });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server Error", msg: "Server Error" });
};
