import { Upscaler, type Model } from "upscalejs"

const BASE_URL = process.env.NODE_ENV === "production" ? "/3x3-generator/" : "/";
let workerCount = parseInt(localStorage.getItem("workerCount") || (navigator.hardwareConcurrency || 4).toString());
let upscaler: Upscaler | null = null;

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

export const scaleImage = async (
  bitmap: ImageBitmap, 
  targetSize: number, 
  modelType: Model = '6B',
  forceUpscale: boolean = false,
  onProgress?: (percent: number) => void
): Promise<ImageBitmap> => {
  return getUpscaler().upscale(bitmap, {
    targetSize,
    model: modelType,
    forceUpscale,
    onProgress,
  });
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
