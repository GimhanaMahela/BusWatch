import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { UPLOAD_LIMITS } from "../config/constants.js";

const upload = multer({
  storage: multer.memoryStorage(), // Buffers go straight to Cloudinary
  limits: {
    // The larger of the two limits; photos are held to theirs below
    fileSize: Math.max(UPLOAD_LIMITS.maxFileBytes, UPLOAD_LIMITS.maxVideoBytes),
    files: UPLOAD_LIMITS.maxImages + UPLOAD_LIMITS.maxVideos,
    fields: 20,
  },
  fileFilter: (_req, file, cb) => {
    // Each field only accepts its own media type
    const expected = file.fieldname === "images" ? "image/" : "video/";
    if (file.mimetype.startsWith(expected)) {
      cb(null, true);
      return;
    }
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    err.message = `Only ${expected.slice(0, -1)} files are allowed in "${file.fieldname}"`;
    cb(err);
  },
});

export type UploadedMedia = { images?: Express.Multer.File[]; videos?: Express.Multer.File[] };

/** Photos keep the smaller limit; videos (dashcam or phone clips) may be up to maxVideoBytes. */
const checkImageSizes = (req: Request, _res: Response, next: NextFunction) => {
  const images = ((req.files ?? {}) as UploadedMedia).images ?? [];
  if (images.some((file) => file.size > UPLOAD_LIMITS.maxFileBytes)) {
    next(new multer.MulterError("LIMIT_FILE_SIZE", "images"));
    return;
  }
  next();
};

export const reportMediaUpload = [
  upload.fields([
    { name: "images", maxCount: UPLOAD_LIMITS.maxImages },
    { name: "videos", maxCount: UPLOAD_LIMITS.maxVideos },
  ]),
  checkImageSizes,
];
