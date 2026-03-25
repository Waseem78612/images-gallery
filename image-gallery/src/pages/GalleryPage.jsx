import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

// Format bytes to human readable (B, KB, MB)
const fmtBytes = (b) => {
  if (!b || b === 0) return "0 B";
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(2) + " MB";
};

// Loading skeleton card placeholder
const SkeletonCard = () => (
  <div className="glass-card overflow-hidden">
    <div className="aspect-square skeleton" />
    <div className="p-3 space-y-2">
      <div className="h-3 skeleton rounded-lg w-3/4" />
      <div className="h-2.5 skeleton rounded-lg w-1/2" />
    </div>
  </div>
);

// Upload zone component - handles file selection
const UploadZone = ({ onUpload }) => {
  const inputRef = useRef(null);
  const handleFiles = (files) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imgs.length) onUpload(imgs);
  };
  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent-glow border border-accent/30 flex items-center justify-center text-xl shrink-0">
          🖼️
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">
            Upload Images
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            Auto compressed 10× smaller · JPEG · PNG · WebP · GIF
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="btn-primary px-4 py-2 text-sm"
        >
          Browse Files
        </button>
      </div>
    </div>
  );
};

// Delete confirmation overlay
const DeleteConfirm = ({ onConfirm, onCancel, deleting }) => (
  <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-3">
    <p className="text-white text-xs sm:text-sm font-semibold text-center">
      Delete this image?
      <br />
      <span className="text-gray-400 font-normal text-xs">
        Cannot be undone.
      </span>
    </p>
    <div className="flex gap-2 w-full">
      <button
        onClick={onConfirm}
        disabled={deleting}
        className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
      >
        {deleting ? (
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          "🗑️ Delete"
        )}
      </button>
      <button
        onClick={onCancel}
        className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
      >
        Cancel
      </button>
    </div>
  </div>
);

// Individual image card component
const ImageCard = ({ img, API, onDelete, onEdit, onOpen }) => {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const isUploading = !!img._uploading;
  const savings = parseFloat(img.compressionRatio) || 0;
  const sizeKB =
    img.compressedSize < 1048576
      ? (img.compressedSize / 1024).toFixed(0) + " KB"
      : (img.compressedSize / 1048576).toFixed(2) + " MB";
  const [serverReady, setServerReady] = useState(false);
  const serverUrl = !isUploading ? `${API}/api/images/${img._id}/view` : null;

  // Preload image to avoid flicker
  useEffect(() => {
    if (!serverUrl) return;
    setServerReady(false);
    const preloader = new window.Image();
    preloader.src = serverUrl;
    preloader.onload = preloader.onerror = () => setServerReady(true);
    return () => {
      preloader.onload = preloader.onerror = null;
    };
  }, [serverUrl]);

  const imgSrc =
    img._preview && !serverReady ? img._preview : serverUrl || img._preview;
  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDelete(img._id);
    setDeleting(false);
    setConfirming(false);
  };

  return (
    <div
      className={`glass-card overflow-hidden flex flex-col group relative transition-opacity ${isUploading ? "opacity-70" : "opacity-100"}`}
    >
      <div
        className="relative aspect-square overflow-hidden bg-surface cursor-zoom-in"
        onClick={() => !confirming && !isUploading && onOpen(img)}
      >
        {imgErr ? (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            🖼️
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={img.title || img.originalName}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        {isUploading && (
          <div className="absolute inset-0 border-2 border-accent animate-pulse rounded-t-2xl pointer-events-none" />
        )}
        {!isUploading && savings > 0 && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-green-950/90 text-green-300">
            -{savings}%
          </div>
        )}
        {!isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!confirming) onEdit(img);
            }}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 hover:bg-accent flex items-center justify-center text-white opacity-0 group-hover:opacity-100"
          >
            ✏️
          </button>
        )}
        {confirming && (
          <DeleteConfirm
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirming(false)}
            deleting={deleting}
          />
        )}
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 flex-1">
        <p
          className="text-white text-xs sm:text-sm font-medium truncate"
          title={img.title || img.originalName}
        >
          {img.title || img.originalName}
        </p>
        {img.description && (
          <p className="text-gray-500 text-xs truncate">{img.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border gap-1">
          <div className="flex flex-col min-w-0">
            {isUploading ? (
              <span className="text-accent-light text-xs font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-light animate-pulse" />
                Saving…
              </span>
            ) : (
              <span className="text-green-400 font-semibold text-xs">
                {sizeKB}
              </span>
            )}
            <span className="text-gray-600 text-xs">
              {img.width && img.height
                ? `${img.width}×${img.height}`
                : fmtBytes(img.originalSize)}
            </span>
          </div>
          {!isUploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
              className="px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-600/80 text-red-400 hover:text-white text-xs font-medium"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Lightbox modal for fullscreen viewing
const Lightbox = ({ img, API, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-1 -right-1 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        >
          ✕
        </button>
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            ←
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            →
          </button>
        )}
        <img
          src={`${API}/api/images/${img._id}/view`}
          alt={img.title || img.originalName}
          className="max-w-full max-h-[70vh] sm:max-h-[78vh] object-contain rounded-xl"
        />
        <div className="glass-card px-4 sm:px-6 py-3 text-center w-full max-w-lg">
          <p className="text-white font-semibold text-sm sm:text-base truncate">
            {img.title || img.originalName}
          </p>
          {img.description && (
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 truncate">
              {img.description}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs text-gray-500">
            <span>
              {img.width}×{img.height}px
            </span>
            <span>·</span>
            <span>{fmtBytes(img.originalSize)} original</span>
            <span>·</span>
            <span className="text-green-400 font-medium">
              {fmtBytes(img.compressedSize)} stored
            </span>
            <span>·</span>
            <span className="text-green-400 font-bold">
              -{img.compressionRatio} saved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit modal for updating image metadata
const EditModal = ({ img, onSave, onClose, token, API }) => {
  const [title, setTitle] = useState(img.title || "");
  const [desc, setDesc] = useState(img.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.patch(
        `${API}/api/images/${img._id}`,
        { title, description: desc },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) onSave({ ...img, title, description: desc });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card glow-border w-full max-w-sm p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base sm:text-lg font-bold text-white mb-4">
          Edit Image
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title…"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Add a description…"
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Gallery Page Component
export default function GalleryPage() {
  const { API, token, authFetch, user } = useAuth();
  const [images, setImages] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  // Fetch user images
  const fetchImages = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await axios.get(`${API}/api/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setImages(data.images || []);
      else setError("Failed to load images.");
    } catch {
      setError("Failed to connect to server.");
    } finally {
      setFetching(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Upload with optimistic UI (show preview instantly)
  const handleUpload = async (files) => {
    setError("");
    const placeholders = files.map((f) => ({
      _id: `temp-${f.name}-${Date.now()}-${Math.random()}`,
      originalName: f.name,
      title: "",
      description: "",
      originalSize: f.size,
      compressedSize: f.size,
      compressionRatio: "0%",
      width: 0,
      height: 0,
      createdAt: new Date().toISOString(),
      _preview: URL.createObjectURL(f),
      _uploading: true,
    }));
    setImages((prev) => [...placeholders, ...prev]);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const { data } = await axios.post(`${API}/api/images/upload`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (data.success) {
        const tempIds = new Set(placeholders.map((p) => p._id));
        setImages((prev) => {
          const withoutTemp = prev.filter((img) => !tempIds.has(img._id));
          placeholders.forEach(
            (p) => p._preview && URL.revokeObjectURL(p._preview),
          );
          return [...(data.images || []), ...withoutTemp];
        });
        const saved = (data.images || []).reduce(
          (acc, img) => acc + img.originalSize - img.compressedSize,
          0,
        );
        setSuccess(
          `✅ ${data.uploaded} image(s) uploaded · ${fmtBytes(saved)} saved`,
        );
      } else {
        const tempIds = new Set(placeholders.map((p) => p._id));
        setImages((prev) => prev.filter((img) => !tempIds.has(img._id)));
        placeholders.forEach(
          (p) => p._preview && URL.revokeObjectURL(p._preview),
        );
        setError(data.message || "Upload failed.");
      }
    } catch (err) {
      const tempIds = new Set(placeholders.map((p) => p._id));
      setImages((prev) => prev.filter((img) => !tempIds.has(img._id)));
      placeholders.forEach(
        (p) => p._preview && URL.revokeObjectURL(p._preview),
      );
      setError(err.response?.data?.message || "Upload failed.");
    }
  };

  // Delete with optimistic UI
  const handleDelete = async (id) => {
    setImages((prev) => prev.filter((img) => img._id !== id));
    if (lightbox !== null)
      setLightbox((prev) => (prev >= images.length ? null : prev));
    try {
      await axios.delete(`${API}/api/images/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchImages();
      setError("Delete failed — image restored.");
    }
  };

  const handleEditSave = (updated) => {
    setImages((prev) =>
      prev.map((img) => (img._id === updated._id ? updated : img)),
    );
    setEditing(null);
  };

  // Download all images as ZIP
  const handleDownloadAll = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/api/images/download-all`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-gallery-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  // Filter images by search
  const filtered = images.filter((img) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (img.title || "").toLowerCase().includes(q) ||
      img.originalName.toLowerCase().includes(q) ||
      (img.description || "").toLowerCase().includes(q)
    );
  });

  // Stats
  const totalOrig = images.reduce((a, i) => a + i.originalSize, 0);
  const totalComp = images.reduce((a, i) => a + i.compressedSize, 0);
  const totalSaved = totalOrig - totalComp;
  const avgRatio = images.length
    ? (
        images.reduce((a, i) => a + parseFloat(i.compressionRatio), 0) /
        images.length
      ).toFixed(1)
    : 0;

  const openLightbox = (img) =>
    setLightbox(filtered.findIndex((i) => i._id === img._id));
  const closeLightbox = () => setLightbox(null);
  const prevImage = () => setLightbox((p) => Math.max(0, p - 1));
  const nextImage = () =>
    setLightbox((p) => Math.min(filtered.length - 1, p + 1));

  return (
    <div className="min-h-screen bg-bg text-gray-100 relative overflow-x-hidden flex flex-col">
      <div className="orb w-64 h-64 sm:w-[500px] sm:h-[500px] bg-indigo-950/25 top-[-8rem] left-[-10rem]" />
      <div className="orb w-56 h-56 sm:w-80 sm:h-80 bg-violet-950/20 top-[50vh] right-[-8rem]" />
      <Navbar />
      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                My Gallery
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Hello,{" "}
                <span className="text-accent-light font-medium">
                  {user?.username}
                </span>{" "}
                — upload and manage your images
              </p>
            </div>
            {images.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse2" />
                {images.length} photo(s) · {fmtBytes(totalComp)} stored
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
            <div className="glass-card px-3 sm:px-4 py-3">
              <p className="text-gray-500 text-xs uppercase">Photos</p>
              <p className="font-display text-sm sm:text-base font-bold text-accent-light">
                {images.length}
              </p>
            </div>
            <div className="glass-card px-3 sm:px-4 py-3">
              <p className="text-gray-500 text-xs uppercase">Original</p>
              <p className="font-display text-sm sm:text-base font-bold text-gray-300">
                {fmtBytes(totalOrig)}
              </p>
            </div>
            <div className="glass-card px-3 sm:px-4 py-3">
              <p className="text-gray-500 text-xs uppercase">Stored</p>
              <p className="font-display text-sm sm:text-base font-bold text-blue-400">
                {fmtBytes(totalComp)}
              </p>
            </div>
            <div className="glass-card px-3 sm:px-4 py-3">
              <p className="text-gray-500 text-xs uppercase">Space Saved</p>
              <p className="font-display text-sm sm:text-base font-bold text-green-400">
                {fmtBytes(totalSaved)}{" "}
                <span className="text-xs text-gray-500">
                  (avg -{avgRatio}%)
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div className="mb-5 sm:mb-6">
          <UploadZone onUpload={handleUpload} />
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs sm:text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="text-red-500">
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-950/50 border border-green-800/50 text-green-300 text-xs sm:text-sm flex items-start gap-2">
            <span>✅</span>
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess("")} className="text-green-500">
              ✕
            </button>
          </div>
        )}

        {/* Search */}
        {images.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 sm:mb-6">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by name, title or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              {filtered.length} of {images.length} image(s)
            </p>
          </div>
        )}

        {/* Grid or Empty State */}
        {fetching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-glow border border-accent/20 flex items-center justify-center text-3xl mb-4">
              📷
            </div>
            <p className="text-gray-200 font-semibold">No images yet</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Click Browse Files above to upload your first image.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-400">No results for "{search}"</p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-xs text-accent-light hover:text-white underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {filtered.map((img) => (
              <ImageCard
                key={img._id}
                img={img}
                API={API}
                onDelete={handleDelete}
                onEdit={setEditing}
                onOpen={openLightbox}
              />
            ))}
          </div>
        )}

        {/* Download All */}
        {!fetching && images.length > 0 && (
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
            <div className="w-full border-t border-border" />
            <p className="text-gray-500 text-xs sm:text-sm text-center">
              All {images.length} image(s) stored as compressed WebP ·{" "}
              <span className="text-green-400">
                {fmtBytes(totalComp)} total
              </span>
            </p>
            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base bg-accent hover:bg-indigo-500 text-white transition-all disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating ZIP…
                </>
              ) : (
                <>
                  ⬇️ Download All as ZIP{" "}
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs font-bold">
                    {fmtBytes(totalComp)}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <Footer />
      {lightbox !== null && filtered[lightbox] && (
        <Lightbox
          img={filtered[lightbox]}
          API={API}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
          hasPrev={lightbox > 0}
          hasNext={lightbox < filtered.length - 1}
        />
      )}
      {editing && (
        <EditModal
          img={editing}
          token={token}
          API={API}
          onSave={handleEditSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
