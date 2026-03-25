import sharp from "sharp";

sharp.concurrency(0); // Disable parallel processing for stability

const MAX_DIM = 1280; // Maximum image dimension in pixels
const EFFORT = 0; // Minimum compression effort (fastest)

// Estimate starting quality based on file size (55-90 range)
const estimateQuality = (bytes) =>
  Math.min(90, Math.max(55, Math.round(92 - (bytes / 1048576 * 4))));

export async function compressImage(inputBuffer) {
  const targetBytes = Math.ceil(inputBuffer.length / 10); // Target 10x compression

  // Resize image once (max 1280px, maintain aspect ratio)
  const resized = await sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
    .withMetadata(false) // Strip EXIF metadata
    .toBuffer();

  let q = estimateQuality(inputBuffer.length); // Start with estimated quality
  let result;

  // Iterate up to 15 times, reducing quality until target size reached
  for (let i = 0; i < 15; i++) {
    result = await sharp(resized)
      .webp({ quality: q, effort: EFFORT })
      .toBuffer({ resolveWithObject: true });

    if (result.data.length <= targetBytes) break; // Target achieved
    q = Math.max(50, q - 1); // Reduce quality by 1 (minimum 50)
  }

  const { data, info } = result; // Extract compressed image and metadata
  const ratio = (inputBuffer.length / data.length).toFixed(1); // Compression ratio
  const saved = ((1 - data.length / inputBuffer.length) * 100).toFixed(1); // Percentage saved

  // Log compression results
  console.log(`🗜️ ${(inputBuffer.length / 1048576).toFixed(2)}MB → ${(data.length / 1024).toFixed(0)}KB | q${q} | ${ratio}x | -${saved}% | ${info.width}×${info.height}`);

  return { buffer: data, width: info.width, height: info.height, size: data.length, format: "webp" };
}