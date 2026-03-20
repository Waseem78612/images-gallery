import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    filename:     { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType:     { type: String, required: true },

    /* Compressed image stored as Buffer in MongoDB */
    data:         { type: Buffer, required: true },

    /* Size stats */
    originalSize:   { type: Number, required: true }, // bytes before compression
    compressedSize: { type: Number, required: true }, // bytes after compression

    /* Image dimensions after compression */
    width:  { type: Number },
    height: { type: Number },

    /* Optional user-provided title/description */
    title:       { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);
export default Image;
