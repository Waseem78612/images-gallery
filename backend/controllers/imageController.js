import Image             from "../models/imageModel.js";
import { compressImage } from "../config/compress.js";
import { v4 as uuidv4 }  from "uuid";
import archiver          from "archiver";

/* ── helper: build safe image response object (no binary) ── */
const safeImage = (img) => ({
  _id:             img._id,
  filename:        img.filename,
  originalName:    img.originalName,
  originalSize:    img.originalSize,
  compressedSize:  img.compressedSize,
  compressionRatio: ((1 - img.compressedSize / img.originalSize) * 100).toFixed(1) + "%",
  width:           img.width,
  height:          img.height,
  title:           img.title   || "",
  description:     img.description || "",
  createdAt:       img.createdAt,
  url:             `/api/images/${img._id}/view`,
});

/* ─────────────────────────────────────────────────────
   POST /api/images/upload
   field: images (multipart)  |  Auth: required
   ───────────────────────────────────────────────────── */
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, message: "No files uploaded." });

    /* Process ALL files in parallel — compress + save simultaneously */
    const settled = await Promise.allSettled(
      req.files.map(async (file) => {
        const compressed = await compressImage(file.buffer);

        const doc = await Image.create({
          owner:          req.userId,
          filename:       `${uuidv4()}.webp`,
          originalName:   file.originalname,
          mimeType:       "image/webp",
          data:           compressed.buffer,
          originalSize:   file.size,
          compressedSize: compressed.size,
          width:          compressed.width,
          height:         compressed.height,
          title:          req.body.title       || "",
          description:    req.body.description || "",
        });

        console.log(`✅ ${file.originalname} → ${(file.size/1024/1024).toFixed(2)}MB → ${(compressed.size/1024).toFixed(0)}KB`);
        return safeImage(doc);
      })
    );

    const results = settled.filter(r => r.status === "fulfilled").map(r => r.value);
    const errors  = settled
      .map((r, i) => r.status === "rejected"
        ? { file: req.files[i].originalname, error: r.reason?.message }
        : null)
      .filter(Boolean);

    return res.status(201).json({
      success:  results.length > 0,
      uploaded: results.length,
      failed:   errors.length,
      images:   results,
      errors,
    });
  } catch (err) {
    console.error("uploadImages error:", err.message);
    return res.status(500).json({ success: false, message: "Upload failed: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────
   GET /api/images
   All images for the logged-in user  |  Auth: required
   ───────────────────────────────────────────────────── */
export const getMyImages = async (req, res) => {
  try {
    const images = await Image
      .find({ owner: req.userId })
      .select("-data")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count:   images.length,
      images:  images.map(safeImage),
    });
  } catch (err) {
    console.error("getMyImages error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch images." });
  }
};

/* ─────────────────────────────────────────────────────
   GET /api/images/:id/view
   Serve compressed image as WebP binary  |  Public
   ───────────────────────────────────────────────────── */
export const viewImage = async (req, res) => {
  try {
    const img = await Image
      .findById(req.params.id)
      .select("data mimeType");

    if (!img || !img.data)
      return res.status(404).json({ success: false, message: "Image not found." });

    const buf = Buffer.isBuffer(img.data) ? img.data : Buffer.from(img.data);

    res.set({
      "Content-Type":        "image/webp",
      "Content-Length":      buf.length,
      "Cache-Control":       "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    return res.end(buf);
  } catch (err) {
    console.error("viewImage error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to serve image." });
  }
};

/* ─────────────────────────────────────────────────────
   DELETE /api/images/:id
   Auth: required — owner only
   ───────────────────────────────────────────────────── */
export const deleteImage = async (req, res) => {
  try {
    const img = await Image.findOne({ _id: req.params.id, owner: req.userId });
    if (!img)
      return res.status(404).json({ success: false, message: "Image not found or not yours." });

    await img.deleteOne();
    console.log(`🗑️  Deleted: ${img.originalName}`);
    return res.json({ success: true, message: "Image deleted." });
  } catch (err) {
    console.error("deleteImage error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete image." });
  }
};

/* ─────────────────────────────────────────────────────
   PATCH /api/images/:id
   Update title / description  |  Auth: required
   ───────────────────────────────────────────────────── */
export const updateImage = async (req, res) => {
  try {
    const { title = "", description = "" } = req.body;

    const img = await Image.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: { title, description } },
      { new: true, select: "-data" }
    );

    if (!img)
      return res.status(404).json({ success: false, message: "Image not found or not yours." });

    return res.json({ success: true, image: safeImage(img) });
  } catch (err) {
    console.error("updateImage error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update image." });
  }
};

/* ─────────────────────────────────────────────────────
   GET /api/images/download-all
   Streams all user images as a ZIP file  |  Auth: required
   ───────────────────────────────────────────────────── */
export const downloadAll = async (req, res) => {
  try {
    const images = await Image
      .find({ owner: req.userId })
      .select("data filename originalName title mimeType")
      .sort({ createdAt: -1 });

    if (images.length === 0)
      return res.status(404).json({ success: false, message: "No images to download." });

    const zipName = `image-gallery-${Date.now()}.zip`;

    res.set({
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Transfer-Encoding":   "chunked",
    });

    const archive = archiver("zip", { zlib: { level: 6 } });

    /* Pipe archive → response */
    archive.pipe(res);

    archive.on("error", (err) => {
      console.error("ZIP error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Failed to create ZIP." });
      }
    });

    for (const img of images) {
      const buf  = Buffer.isBuffer(img.data) ? img.data : Buffer.from(img.data);
      const name = img.title
        ? `${img.title.replace(/[^a-zA-Z0-9_\- ]/g, "_")}.webp`
        : img.filename || `${img._id}.webp`;

      archive.append(buf, { name });
    }

    await archive.finalize();
    console.log(`📦 ZIP: ${images.length} images → ${zipName}`);
  } catch (err) {
    console.error("downloadAll error:", err.message);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: "Failed to create ZIP." });
  }
};

/* ─────────────────────────────────────────────────────
   GET /api/images/all
   Returns ALL images from ALL users — no binary data
   Dev/admin use only
   ───────────────────────────────────────────────────── */
export const getAllImages = async (_req, res) => {
  try {
    const images = await Image
      .find()
      .select("-data")
      .sort({ createdAt: -1 })
      .populate("owner", "username email");

    return res.json({
      success: true,
      count:   images.length,
      images:  images.map((img) => ({
        ...safeImage(img),
        owner: img.owner
          ? { _id: img.owner._id, username: img.owner.username, email: img.owner.email }
          : null,
      })),
    });
  } catch (err) {
    console.error("getAllImages error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch images." });
  }
};
