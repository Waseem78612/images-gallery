import express from "express";
import multer from "multer";
import upload from "../config/multer.js";
import auth from "../middleware/auth.js";
import {
  uploadImages, getMyImages, viewImage, deleteImage,
  updateImage, downloadAll, getAllImages
} from "../controllers/imageController.js";

const imageRouter = express.Router();

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
  upload.array("images", 20)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, message: "File too large. Max 50MB per image." });
      if (err.code === "LIMIT_FILE_COUNT") return res.status(400).json({ success: false, message: "Too many files. Max 20 at once." });
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message || "Upload error." });
  });
};

// Routes: named routes first, wildcards last
imageRouter.post("/upload", auth, handleUpload, uploadImages); // Upload images
imageRouter.get("/", auth, getMyImages); // Get user's images
imageRouter.get("/download-all", auth, downloadAll); // Download all as ZIP
imageRouter.get("/all", getAllImages); // Get all images (admin/dev)
imageRouter.get("/:id/view", viewImage); // Serve image (public)
imageRouter.patch("/:id", auth, updateImage); // Update title/description
imageRouter.delete("/:id", auth, deleteImage); // Delete image

export default imageRouter;