/**
 * Image Compression Utility
 * Compresses images to reduce file size while maintaining acceptable quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  mimeType?: "image/jpeg" | "image/webp" | "image/png";
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  mimeType: "image/webp",
};

/**
 * Load an image from a File object
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if image exceeds max dimensions
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
};

/**
 * Convert canvas to File
 */
const canvasToFile = (
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
  quality: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Generate new filename with correct extension
          const ext = mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "jpg";
          const baseName = fileName.replace(/\.[^/.]+$/, "");
          const newFileName = `${baseName}.${ext}`;
          
          const file = new File([blob], newFileName, { type: mimeType });
          resolve(file);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      mimeType,
      quality
    );
  });
};

/**
 * Compress a single image
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxWidth, maxHeight, quality, mimeType } = opts;

  // Skip compression for already small files (< 100KB)
  if (file.size < 100 * 1024) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      width: 0,
      height: 0,
    };
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth!,
    maxHeight!
  );

  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use better image smoothing for higher quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  // Convert to file
  const compressedFile = await canvasToFile(canvas, file.name, mimeType!, quality!);

  // If compressed file is larger than original, use original
  if (compressedFile.size >= file.size) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  }

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: file.size / compressedFile.size,
    width,
    height,
  };
};

/**
 * Compress multiple images
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], options);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }

  return results;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Get total compression stats
 */
export const getCompressionStats = (results: CompressionResult[]) => {
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const savedBytes = totalOriginal - totalCompressed;
  const savedPercentage = totalOriginal > 0 ? (savedBytes / totalOriginal) * 100 : 0;

  return {
    totalOriginal,
    totalCompressed,
    savedBytes,
    savedPercentage,
    formattedOriginal: formatFileSize(totalOriginal),
    formattedCompressed: formatFileSize(totalCompressed),
    formattedSaved: formatFileSize(savedBytes),
  };
};
