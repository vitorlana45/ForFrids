import imageCompression from 'browser-image-compression';

const PRESETS = {
  avatar: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  },
  timeline: {
    maxSizeMB: 1.0,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  },
  cover: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1440,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  },
} as const;

export async function compress(
  file: File,
  preset: keyof typeof PRESETS,
): Promise<File> {
  return imageCompression(file, PRESETS[preset]);
}
