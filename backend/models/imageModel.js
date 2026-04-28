import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // User who owns the image
    filename: { type: String, required: true }, // Unique stored filename
    originalName: { type: String, required: true }, // Original uploaded filename
    mimeType: { type: String, required: true }, // MIME type of original file
    data: { type: Buffer, required: true }, // Compressed image binary data
    originalSize: { type: Number, required: true }, // Size before compression (bytes)
    compressedSize: { type: Number, required: true }, // Size after compression (bytes)
    width: { type: Number }, // Image width after compression
    height: { type: Number }, // Image height after compression
    title: { type: String, default: "" }, // Optional user-provided title
    description: { type: String, default: "" }, // Optional user-provided description
  },
  { timestamps: true } // Auto-add createdAt & updatedAt
);

export default mongoose.model("Image", imageSchema);