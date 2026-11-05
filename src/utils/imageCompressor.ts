/**
 * Client-Side Image Resizer & Compressor for Paper Rx Photo Capture
 * Compresses camera/gallery photos down to max 1280px width (JPEG ~200-250KB)
 * for rapid offline IndexedDB storage and seamless sync without bloating memory.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressPaperRxImage(
  fileOrBlob: File | Blob,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.78,
    mimeType = 'image/jpeg'
  } = options;

  // Node/test environment fallback
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down proportionally if larger than maximum dimension
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to simple FileReader if canvas 2d context fails
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBlob);
        return;
      }

      // Draw high-quality resized image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image for compression: ${err}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Calculates approximate size in Kilobytes of a base64 Data URL string
 */
export function getBase64SizeInKB(base64String: string): number {
  if (!base64String) return 0;
  const padding = (base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0);
  const base64Length = base64String.length - (base64String.indexOf(',') + 1);
  const bytes = (base64Length * 3) / 4 - padding;
  return Math.round(bytes / 1024);
}

