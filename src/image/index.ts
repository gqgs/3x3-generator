import { Upscaler, type Model } from "upscalejs"

const BASE_URL = process.env.NODE_ENV === "production" ? "/3x3-generator/" : "/";
let workerCount = parseInt(localStorage.getItem("workerCount") || (navigator.hardwareConcurrency || 4).toString());
let upscaler: Upscaler | null = null;
const inputIds = new WeakMap<ImageBitmap, number>();
const inputHashes = new WeakMap<ImageBitmap, Promise<string>>();
const upscaleCache = new Map<string, Promise<Blob>>();
let nextInputId = 1;
const MAX_UPSCALE_CACHE_ENTRIES = 64;

const getBaseUrl = () => window.location.origin + BASE_URL;

const getUpscaler = () => {
  if (!upscaler) {
    upscaler = new Upscaler({
      base: getBaseUrl(),
      workerCount,
      numThreads: 1,
    });
  }
  return upscaler;
};

export const setWorkerCount = (count: number) => {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Worker count must be a positive integer");
  }

  if (workerCount !== count) {
    workerCount = count;
    upscaler?.setWorkerCount(count);
  }
};

export const getWorkerCount = () => workerCount;

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");

const fallbackHash = (data: Uint8ClampedArray) => {
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const getInputId = (bitmap: ImageBitmap) => {
  const existing = inputIds.get(bitmap);
  if (existing) return existing;

  const id = nextInputId++;
  inputIds.set(bitmap, id);
  return id;
};

const hashBitmap = async (bitmap: ImageBitmap): Promise<string> => {
  const cached = inputHashes.get(bitmap);
  if (cached) return cached;

  const hashPromise = readBitmapHash(bitmap);
  inputHashes.set(bitmap, hashPromise);
  return hashPromise;
};

const readBitmapHash = async (bitmap: ImageBitmap): Promise<string> => {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return `bitmap:${getInputId(bitmap)}`;
  }

  try {
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const digest = await crypto.subtle.digest("SHA-256", imageData.data);
      return `sha256:${bytesToHex(new Uint8Array(digest))}`;
    }
    return `fnv1a:${fallbackHash(imageData.data)}`;
  } catch {
    return `bitmap:${getInputId(bitmap)}`;
  }
};

const getCacheKey = async (
  bitmap: ImageBitmap,
  targetSize: number,
  modelType: Model,
  forceUpscale: boolean,
) => {
  const inputHash = await hashBitmap(bitmap);
  return [
    "v1",
    modelType,
    targetSize,
    forceUpscale ? "force" : "auto",
    bitmap.width,
    bitmap.height,
    inputHash,
  ].join(":");
};

const imageBitmapToBlob = (bitmap: ImageBitmap): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Could not create canvas context"));
  }

  ctx.drawImage(bitmap, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not encode upscaled image"));
      }
    }, "image/png");
  });
};

const rememberCacheEntry = (key: string, entry: Promise<Blob>) => {
  if (upscaleCache.size >= MAX_UPSCALE_CACHE_ENTRIES) {
    const oldestKey = upscaleCache.keys().next().value;
    if (oldestKey) {
      upscaleCache.delete(oldestKey);
    }
  }
  upscaleCache.set(key, entry);
};

export const scaleImage = async (
  bitmap: ImageBitmap, 
  targetSize: number, 
  modelType: Model = '6B',
  forceUpscale: boolean = false,
  onProgress?: (percent: number) => void
): Promise<ImageBitmap> => {
  const cacheKey = await getCacheKey(bitmap, targetSize, modelType, forceUpscale);
  const cached = upscaleCache.get(cacheKey);
  if (cached) {
    const blob = await cached;
    onProgress?.(100);
    return createImageBitmap(blob);
  }

  const upscalePromise = getUpscaler().upscale(bitmap, {
    targetSize,
    model: modelType,
    forceUpscale,
    onProgress,
  }).then(async upscaled => {
    try {
      return await imageBitmapToBlob(upscaled);
    } finally {
      upscaled.close();
    }
  });

  rememberCacheEntry(cacheKey, upscalePromise);

  try {
    return createImageBitmap(await upscalePromise);
  } catch (error) {
    upscaleCache.delete(cacheKey);
    throw error;
  }
};

export const releasePool = async () => {
  await upscaler?.release();
};

export const downscaleImage = async (source: ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  return scaleImage(source, targetSize);
};

export default {
  downscaleImage,
  scaleImage,
  releasePool
};
