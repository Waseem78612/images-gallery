import express from "express";
import multer  from "multer";
import upload  from "../config/multer.js";
import auth    from "../middleware/auth.js";
import {
  uploadImages,
  getMyImages,
  viewImage,
  deleteImage,
  updateImage,
  downloadAll,
  getAllImages,
} from "../controllers/imageController.js";

const imageRouter = express.Router();

/* ── Multer error wrapper ── */
function handleUpload(req, res, next) {
  upload.array("images", 20)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE")
        return res.status(400).json({ success: false, message: "File too large. Max 50MB per image." });
      if (err.code === "LIMIT_FILE_COUNT")
        return res.status(400).json({ success: false, message: "Too many files. Max 20 at once." });
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message || "Upload error." });
  });
}

/*
 * ── ROUTE ORDER RULES ──
 * 1. Static named paths   BEFORE  /:param wildcards
 * 2. Two-segment paths    (:id/view) are safe alongside single-segment
 *    named paths (/upload, /download-all) — no conflict
 * 3. /:id wildcards come LAST for each HTTP method
 *
 * Final resolved paths (root mounts this at /api/images):
 *   POST   /api/images/upload          ← multipart upload
 *   GET    /api/images                 ← list my images
 *   GET    /api/images/download-all    ← download ZIP
 *   GET    /api/images/:id/view        ← serve image binary (public)
 *   PATCH  /api/images/:id             ← update title/description
 *   DELETE /api/images/:id             ← delete image
 */

/* POST — named first */
imageRouter.post("/upload",       auth, handleUpload, uploadImages);

/* GET — named routes first, then wildcards */
imageRouter.get("/",              auth, getMyImages);
imageRouter.get("/download-all",  auth, downloadAll);
imageRouter.get("/all",           getAllImages);        // GET  /api/images/all  (dev — all images)
imageRouter.get("/:id/view",      viewImage);           // public — no auth needed

/* PATCH / DELETE — /:id wildcards */
imageRouter.patch("/:id",         auth, updateImage);
imageRouter.delete("/:id",        auth, deleteImage);

export default imageRouter;
