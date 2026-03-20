import express     from "express";
import cors        from "cors";
import dotenv      from "dotenv";
import connectDB   from "./config/mongodb.js";
import userRouter  from "./routes/userRoute.js";
import imageRouter from "./routes/imageRoute.js";

dotenv.config();
connectDB();

const app = express();

/* ── CORS ── */
app.use(cors({
  origin:         "*",
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ── Body parsers — JSON limit 10mb (multipart handled by multer separately) ── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ── Routes ──
   This app is mounted at /api by root server.js
   /user   → /api/user/...
   /images → /api/images/...  */
app.use("/user",   userRouter);
app.use("/images", imageRouter);

/* ── Health check ── */
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Image Gallery API ✅",
    routes: {
      auth: [
        "POST /api/user/register",
        "POST /api/user/login",
        "GET  /api/user/me",
      ],
      images: [
        "POST   /api/images/upload   (auth, multipart/form-data, field=images)",
        "GET    /api/images          (auth) list my images",
        "GET    /api/images/:id/view         serve compressed image",
        "PATCH  /api/images/:id     (auth) update title/description",
        "DELETE /api/images/:id     (auth) delete image",
      ],
    },
  });
});

/* ── 404 ── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

/* ── Global error handler (Express 4 requires 4 params) ── */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || "Internal server error." });
});

export default app;
