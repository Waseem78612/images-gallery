import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

/* ── helpers ── */
function fmtBytes(b) {
  if (!b || b === 0) return "0 B";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(2) + " MB";
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton rounded-lg w-3/4" />
        <div className="h-2.5 skeleton rounded-lg w-1/2" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Compact Upload Zone
   — small box, events only on the button/label
   — no whole-box click trap
══════════════════════════════════════════ */
function UploadZone({ onUpload }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imgs.length) onUpload(imgs);
  };

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent-glow border border-accent/30
                        flex items-center justify-center text-xl shrink-0">
          🖼️
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Upload Images</p>
          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              Auto compressed 10× smaller
            </span>
            <span className="text-gray-700">·</span>
            <span>JPEG · PNG · WebP · GIF</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input ref={inputRef} type="file" multiple accept="image/*"
          className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <button onClick={() => inputRef.current?.click()} className="btn-primary px-4 py-2 text-sm">
          Browse Files
        </button>
      </div>
    </div>
  );
}

/* ── Delete confirm inline ── */
function DeleteConfirm({ onConfirm, onCancel, deleting }) {
  return (
    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-3">
      <p className="text-white text-xs sm:text-sm font-semibold text-center leading-snug">
        Delete this image?<br />
        <span className="text-gray-400 font-normal text-xs">This cannot be undone.</span>
      </p>
      <div className="flex gap-2 w-full">
        <button onClick={onConfirm} disabled={deleting}
          className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1">
          {deleting
            ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : "🗑️ Delete"}
        </button>
        <button onClick={onCancel}
          className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all active:scale-95">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Image Card ── */
function ImageCard({ img, API, onDelete, onEdit, onOpen }) {
  const [deleting,   setDeleting]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [imgErr,     setImgErr]     = useState(false);

  const isUploading = !!img._uploading;
  const savings     = parseFloat(img.compressionRatio) || 0;
  const sizeKB      = img.compressedSize < 1024 * 1024
    ? (img.compressedSize / 1024).toFixed(0) + " KB"
    : (img.compressedSize / 1024 / 1024).toFixed(2) + " MB";

  /* Track whether the real server image has finished loading */
  const [serverReady, setServerReady] = useState(false);
  const serverUrl = !isUploading ? `${API}/api/images/${img._id}/view` : null;

  /* Preload the server image silently as soon as we have the URL.
     Only switch src once it's fully in browser cache — zero flicker. */
  useEffect(() => {
    if (!serverUrl) return;
    setServerReady(false);
    const preloader = new window.Image();
    preloader.src = serverUrl;
    preloader.onload  = () => setServerReady(true);
    preloader.onerror = () => setServerReady(true); // show server url anyway on error
    return () => { preloader.onload = null; preloader.onerror = null; };
  }, [serverUrl]);

  /* Show blob preview until server image is loaded and ready */
  const imgSrc = (img._preview && !serverReady) ? img._preview : (serverUrl || img._preview);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDelete(img._id);
    setDeleting(false);
    setConfirming(false);
  };

  return (
    <div className={`glass-card overflow-hidden flex flex-col group relative transition-opacity duration-300 ${isUploading ? "opacity-70" : "opacity-100"}`}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface cursor-zoom-in"
        onClick={() => !confirming && !isUploading && onOpen(img)}>
        {imgErr ? (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl select-none">🖼️</div>
        ) : (
          <img
            src={imgSrc}
            alt={img.title || img.originalName}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Uploading indicator — just a subtle pulsing border, no overlay blocking the image */}
        {isUploading && (
          <div className="absolute inset-0 border-2 border-accent animate-pulse rounded-t-2xl pointer-events-none" />
        )}

        {/* Compression badge */}
        {!isUploading && savings > 0 && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold
                          bg-green-950/90 text-green-300 border border-green-700/50 shadow select-none">
            -{savings}%
          </div>
        )}

        {/* Edit button */}
        {!isUploading && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!confirming) onEdit(img); }}
            className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg
                       bg-black/50 hover:bg-accent border border-white/10
                       flex items-center justify-center text-white text-xs
                       transition-all active:scale-90 opacity-0 group-hover:opacity-100 sm:opacity-100">
            ✏️
          </button>
        )}

        {/* Delete confirm overlay */}
        {confirming && (
          <DeleteConfirm
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirming(false)}
            deleting={deleting}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-white text-xs sm:text-sm font-medium truncate leading-snug"
          title={img.title || img.originalName}>
          {img.title || img.originalName}
        </p>
        {img.description && (
          <p className="text-gray-500 text-xs truncate">{img.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border gap-1">
          <div className="flex flex-col min-w-0">
            {isUploading
              ? <span className="text-accent-light text-xs font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent-light animate-pulse shrink-0" />
                  Saving…
                </span>
              : <span className="text-green-400 font-semibold text-xs">{sizeKB}</span>
            }
            <span className="text-gray-600 text-xs">
              {img.width && img.height ? `${img.width}×${img.height}` : fmtBytes(img.originalSize)}
            </span>
          </div>
          {!isUploading && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
              disabled={deleting}
              className="flex items-center gap-1 px-2 py-1 rounded-lg
                         bg-red-950/40 hover:bg-red-600/80 border border-red-800/40 hover:border-red-500/60
                         text-red-400 hover:text-white text-xs font-medium
                         transition-all active:scale-90 disabled:opacity-50 shrink-0">
              🗑️ <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Lightbox ── */
function Lightbox({ img, API, onClose, onPrev, onNext, hasPrev, hasNext }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft"  && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}>
      <div className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-1 -right-1 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-sm">
          ✕
        </button>
        {hasPrev && (
          <button onClick={onPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 sm:-translate-x-4 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-sm">
            ←
          </button>
        )}
        {hasNext && (
          <button onClick={onNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 sm:translate-x-4 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-sm">
            →
          </button>
        )}
        <img src={`${API}/api/images/${img._id}/view`} alt={img.title || img.originalName}
          className="max-w-full max-h-[70vh] sm:max-h-[78vh] object-contain rounded-xl shadow-2xl" />
        <div className="glass-card px-4 sm:px-6 py-3 text-center w-full max-w-lg">
          <p className="text-white font-semibold text-sm sm:text-base truncate">{img.title || img.originalName}</p>
          {img.description && <p className="text-gray-400 text-xs sm:text-sm mt-0.5 truncate">{img.description}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs text-gray-500">
            <span>{img.width}×{img.height}px</span>
            <span>·</span>
            <span>{fmtBytes(img.originalSize)} <span className="text-gray-600">original</span></span>
            <span>·</span>
            <span className="text-green-400 font-medium">{fmtBytes(img.compressedSize)} stored</span>
            <span>·</span>
            <span className="text-green-400 font-bold">-{img.compressionRatio} saved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ img, onSave, onClose, token, API }) {
  const [title,  setTitle]  = useState(img.title || "");
  const [desc,   setDesc]   = useState(img.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.patch(
        `${API}/api/images/${img._id}`,
        { title, description: desc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) onSave({ ...img, title, description: desc });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="glass-card glow-border w-full max-w-sm p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-base sm:text-lg font-bold text-white mb-4">Edit Image</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title…" className="input-field" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Add a description…" rows={3} className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
              : "Save Changes"}
          </button>
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main GalleryPage
══════════════════════════════════════════ */
export default function GalleryPage() {
  const { API, token, authFetch, user } = useAuth();

  const [images,      setImages]      = useState([]);
  const [fetching,    setFetching]    = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [lightbox,    setLightbox]    = useState(null);
  const [editing,     setEditing]     = useState(null);
  const [search,      setSearch]      = useState("");

  /* ── Fetch images using axios ── */
  const fetchImages = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await axios.get(`${API}/api/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setImages(data.images || []);
      else setError("Failed to load images.");
    } catch { setError("Failed to connect to server."); }
    finally  { setFetching(false); }
  }, [API, token]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  /* ── Upload using axios (with progress) ── */
  /* ── Upload — OPTIMISTIC UI ──
     1. Show placeholder cards instantly from local files (0s feel)
     2. Upload + compress on server in background
     3. Replace placeholders with real data when done          */
  const handleUpload = async (files) => {
    setError("");

    /* Step 1 — build instant placeholder cards from local File objects */
    const placeholders = files.map((f) => ({
      _id:           `temp-${f.name}-${Date.now()}-${Math.random()}`,
      originalName:  f.name,
      title:         "",
      description:   "",
      originalSize:  f.size,
      compressedSize:f.size,
      compressionRatio: "0%",
      width:         0,
      height:        0,
      createdAt:     new Date().toISOString(),
      url:           "",
      _preview:      URL.createObjectURL(f),   // local blob URL for instant preview
      _uploading:    true,                      // flag to show spinner on card
    }));

    /* Show them immediately — user sees images appear at once */
    setImages((prev) => [...placeholders, ...prev]);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));

      const { data } = await axios.post(`${API}/api/images/upload`, fd, {
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        /* Step 2 — replace placeholders with real server data */
        setImages((prev) => {
          const tempIds = new Set(placeholders.map((p) => p._id));
          const withoutTemp = prev.filter((img) => !tempIds.has(img._id));
          /* Revoke blob URLs to free memory */
          placeholders.forEach((p) => p._preview && URL.revokeObjectURL(p._preview));
          return [...(data.images || []), ...withoutTemp];
        });
        const saved = (data.images || []).reduce(
          (acc, img) => acc + img.originalSize - img.compressedSize, 0
        );
        setSuccess(`✅ ${data.uploaded} image${data.uploaded !== 1 ? "s" : ""} uploaded · ${fmtBytes(saved)} saved`);
      } else {
        /* Remove placeholders on failure */
        const tempIds = new Set(placeholders.map((p) => p._id));
        setImages((prev) => prev.filter((img) => !tempIds.has(img._id)));
        placeholders.forEach((p) => p._preview && URL.revokeObjectURL(p._preview));
        setError(data.message || "Upload failed.");
      }
    } catch (err) {
      const tempIds = new Set(placeholders.map((p) => p._id));
      setImages((prev) => prev.filter((img) => !tempIds.has(img._id)));
      placeholders.forEach((p) => p._preview && URL.revokeObjectURL(p._preview));
      setError(err.response?.data?.message || "Upload failed. Check your connection.");
    }
  };

  /* ── Delete — OPTIMISTIC UI ──
     Remove from screen instantly, delete on server in background */
  const handleDelete = async (id) => {
    /* Step 1 — remove from UI immediately (feels instant) */
    setImages((prev) => prev.filter((img) => img._id !== id));
    if (lightbox !== null) {
      const next = images.filter((img) => img._id !== id);
      setLightbox(next.length === 0 ? null : (p) => Math.min(p, next.length - 1));
    }
    /* Step 2 — delete on server silently in background */
    try {
      await axios.delete(`${API}/api/images/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* If server delete fails, fetch fresh list to restore correct state */
      fetchImages();
      setError("Delete failed — image restored.");
    }
  };

  /* ── Edit save ── */
  const handleEditSave = (updated) => {
    setImages((prev) => prev.map((img) => img._id === updated._id ? updated : img));
    setEditing(null);
  };

  /* ── Download all as ZIP ── */
  const handleDownloadAll = async () => {
    setDownloading(true); setError("");
    try {
      const res = await axios.get(`${API}/api/images/download-all`, {
        headers:      { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url  = URL.createObjectURL(res.data);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `my-gallery-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { setError("Download failed. Check your connection."); }
    finally  { setDownloading(false); }
  };

  /* ── Filtered images ── */
  const filtered = images.filter((img) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (img.title || "").toLowerCase().includes(q) ||
           img.originalName.toLowerCase().includes(q) ||
           (img.description || "").toLowerCase().includes(q);
  });

  /* ── Stats ── */
  const totalOrig  = images.reduce((a, i) => a + i.originalSize,   0);
  const totalComp  = images.reduce((a, i) => a + i.compressedSize, 0);
  const totalSaved = totalOrig - totalComp;
  const avgRatio   = images.length
    ? (images.reduce((a, i) => a + parseFloat(i.compressionRatio), 0) / images.length).toFixed(1)
    : 0;

  const openLightbox  = (img) => setLightbox(filtered.findIndex((i) => i._id === img._id));
  const closeLightbox = () => setLightbox(null);
  const prevImage     = () => setLightbox((p) => Math.max(0, p - 1));
  const nextImage     = () => setLightbox((p) => Math.min(filtered.length - 1, p + 1));

  return (
    <div className="min-h-screen bg-bg text-gray-100 relative overflow-x-hidden flex flex-col">
      <div className="orb w-64 h-64 sm:w-[500px] sm:h-[500px] bg-indigo-950/25 top-[-8rem] left-[-10rem]" />
      <div className="orb w-56 h-56 sm:w-80 sm:h-80 bg-violet-950/20 top-[50vh] right-[-8rem]" />

      <Navbar />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* ── Header ── */}
        <div className="mb-6 sm:mb-8" style={{ animation: "fadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                My Gallery
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Hello, <span className="text-accent-light font-medium">{user?.username}</span> — upload and manage your images
              </p>
            </div>
            {images.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse2" />
                {images.length} photo{images.length !== 1 ? "s" : ""} · {fmtBytes(totalComp)} stored
              </div>
            )}
          </div>
        </div>

        {/* ── Stats bar ── */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6"
            style={{ animation: "fadeUp 0.45s 0.05s cubic-bezier(0.4,0,0.2,1) both" }}>
            {[
              { label: "Photos",      value: images.length,       color: "text-accent-light" },
              { label: "Original",    value: fmtBytes(totalOrig),  color: "text-gray-300"     },
              { label: "Stored",      value: fmtBytes(totalComp),  color: "text-blue-400"     },
              { label: "Space Saved", value: fmtBytes(totalSaved), color: "text-green-400", suffix: ` (avg -${avgRatio}%)` },
            ].map(({ label, value, color, suffix }) => (
              <div key={label} className="glass-card px-3 sm:px-4 py-3 flex flex-col gap-1">
                <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
                <p className={`font-display text-sm sm:text-base font-bold ${color}`}>
                  {value}
                  {suffix && <span className="text-xs font-normal text-gray-500">{suffix}</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Compact Upload Zone ── */}
        <div className="mb-5 sm:mb-6"
          style={{ animation: "fadeUp 0.45s 0.1s cubic-bezier(0.4,0,0.2,1) both" }}>
          <UploadZone onUpload={handleUpload} />
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs sm:text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-300 shrink-0">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-950/50 border border-green-800/50 text-green-300 text-xs sm:text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">✅</span>
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess("")} className="text-green-500 hover:text-green-300 shrink-0">✕</button>
          </div>
        )}

        {/* ── Search ── */}
        {images.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 sm:mb-6"
            style={{ animation: "fadeUp 0.45s 0.15s cubic-bezier(0.4,0,0.2,1) both" }}>
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input type="text" placeholder="Search by name, title or description…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9" />
            </div>
            <p className="text-gray-500 text-xs sm:text-sm shrink-0">
              {filtered.length} of {images.length} image{images.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* ── Grid ── */}
        {fetching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-accent-glow border border-accent/20 flex items-center justify-center text-3xl sm:text-4xl mb-4">📷</div>
            <p className="text-gray-200 font-semibold text-base sm:text-lg">No images yet</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-xs">
              Click Browse Files above to upload your first image.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-400 text-base font-medium">No results for "{search}"</p>
            <button onClick={() => setSearch("")}
              className="mt-3 text-xs text-accent-light hover:text-white underline underline-offset-2">
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4"
            style={{ animation: "fadeUp 0.45s 0.2s cubic-bezier(0.4,0,0.2,1) both" }}>
            {filtered.map((img) => (
              <ImageCard key={img._id} img={img} API={API}
                onDelete={handleDelete}
                onEdit={(i) => setEditing(i)}
                onOpen={openLightbox} />
            ))}
          </div>
        )}

        {/* ── Download All ZIP ── */}
        {!fetching && images.length > 0 && (
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
            <div className="w-full border-t border-border" />
            <p className="text-gray-500 text-xs sm:text-sm text-center mt-2">
              All {images.length} image{images.length !== 1 ? "s" : ""} stored as compressed WebP
              &nbsp;·&nbsp;
              <span className="text-green-400">{fmtBytes(totalComp)} total</span>
            </p>
            <button onClick={handleDownloadAll} disabled={downloading}
              className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base
                         bg-accent hover:bg-indigo-500 active:scale-95 text-white transition-all duration-200 shadow-lg shadow-accent/20
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100">
              {downloading ? (
                <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating ZIP…</>
              ) : (
                <>⬇️ Download All as ZIP
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs font-bold">{fmtBytes(totalComp)}</span>
                </>
              )}
            </button>
            <p className="text-gray-600 text-xs text-center">Downloads all your images in a single compressed ZIP file</p>
          </div>
        )}

      </div>

      <Footer />

      {lightbox !== null && filtered[lightbox] && (
        <Lightbox img={filtered[lightbox]} API={API}
          onClose={closeLightbox} onPrev={prevImage} onNext={nextImage}
          hasPrev={lightbox > 0} hasNext={lightbox < filtered.length - 1} />
      )}

      {editing && (
        <EditModal img={editing} token={token} API={API}
          onSave={handleEditSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
