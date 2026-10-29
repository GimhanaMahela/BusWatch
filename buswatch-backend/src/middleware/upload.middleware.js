const multer = require("multer");

const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;

const storage = multer.memoryStorage(); // Store files in memory as buffers

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: MAX_IMAGES + MAX_VIDEOS,
    fields: 20,
  },
  fileFilter: (req, file, cb) => {
    // Each field only accepts its own media type
    const expected = file.fieldname === "images" ? "image/" : "video/";
    if (file.mimetype.startsWith(expected)) {
      cb(null, true);
    } else {
      const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
      err.message = `Only ${expected.slice(0, -1)} files are allowed in "${file.fieldname}"`;
      cb(err, false);
    }
  },
});

module.exports = upload.fields([
  { name: "images", maxCount: MAX_IMAGES },
  { name: "videos", maxCount: MAX_VIDEOS },
]);
