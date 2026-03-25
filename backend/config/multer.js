import multer from "multer";

// Store in memory for sharp compression
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed."), false);
};

const upload = multer({
  storage, // Memory storage
  fileFilter, // Image type validation
  limits: { fileSize: 50 * 1024 * 1024, files: 20 }, // 50MB/file, 20 files max
});

export default upload;