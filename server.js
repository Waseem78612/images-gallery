import path              from "path";
import { fileURLToPath } from "url";
import express           from "express";
import backendApp        from "./backend/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app  = express();

/* ── 1. Mount backend API at /api ── */
app.use("/api", backendApp);

/* ── 2. Serve built React frontend ── */
const frontendDist = path.join(__dirname, "image-gallery", "dist");
app.use(express.static(frontendDist));

/* ── 3. SPA fallback ── */
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀  Server  →  http://localhost:${PORT}`);
  console.log(`📦  Env     →  ${process.env.NODE_ENV || "development"}\n`);
});
