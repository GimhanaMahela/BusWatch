const multer = require("multer");

const notFound = (req, res) => {
  res.status(404).json({ msg: "Not found" });
};

// Errors thrown by middleware (e.g. file uploads) end up here
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "Each file must be 10MB or smaller.",
      LIMIT_FILE_COUNT: "Too many files. Upload at most 5 images and 2 videos.",
      LIMIT_UNEXPECTED_FILE: err.message || "Unexpected file upload.",
    };
    return res.status(400).json({
      message: messages[err.code] || err.message,
      field: err.field,
    });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server Error" });
};

module.exports = { notFound, errorHandler };
