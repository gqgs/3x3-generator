import * as ort from "onnxruntime-web";

// Configure ONNX Runtime on main thread to NOT use proxy
ort.env.wasm.proxy = false;

// Use the worker for scaling
const BASE_URL = process.env.NODE_ENV === "production" ? "/3x3-generator/" : "/";

let worker: Worker | null = null;
const pendingJobs = new Map<string, {
  resolve: (bitmap: ImageBitmap) => void;
  reject: (error: Error) => void;
  onProgress?: (percent: number) => void;
}>();

let nextJobId = 0;

const getWorker = () => {
  if (!worker) {
    console.log("Creating new image worker");
    worker = new Worker(new URL('./image.worker.ts', import.meta.url));
    
    worker.onmessage = (e) => {
      // Ignore messages that don't match our protocol (e.g. internal ORT messages)
      if (!e.data || typeof e.data !== 'object' || Array.isArray(e.data)) {
        return;
      }

      const { id, type, bitmap, percent, error } = e.data;
      if (!id) return;

      const job = pendingJobs.get(id);
      if (!job) return;

      try {
        if (type === 'progress') {
          if (job.onProgress) job.onProgress(percent);
        } else if (type === 'done') {
          pendingJobs.delete(id);
          job.resolve(bitmap);
        } else if (type === 'error') {
          pendingJobs.delete(id);
          job.reject(new Error(error || "Unknown worker error"));
        }
      } catch (err) {
        console.error("Error handling worker message:", err);
      }
    };

    worker.onerror = (e) => {
      console.error("Worker error event:", e);
    };
  }
  return worker;
};

export const scaleImage = async (
  bitmap: ImageBitmap, 
  targetSize: number, 
  modelType: '6B' | 'Swin2SR' = '6B',
  onProgress?: (percent: number) => void
): Promise<ImageBitmap> => {
  const w = getWorker();
  const id = (nextJobId++).toString();
  // Create a copy to transfer so the original in the store stays valid
  const bitmapToTransfer = await createImageBitmap(bitmap);

  return new Promise((resolve, reject) => {
    pendingJobs.set(id, { resolve, reject, onProgress });
    // Transfer the copy of the bitmap to the worker
    w.postMessage({
      type: 'scale',
      id,
      bitmap: bitmapToTransfer,
      targetSize,
      modelType,
      baseUrl: window.location.origin + BASE_URL
    }, [bitmapToTransfer]);
  });
};

export const releasePool = async () => {
  if (worker) {
    worker.postMessage({ type: 'release' });
    // We don't necessarily need to wait for it or terminate it here,
    // but we could if we wanted to fully clean up.
  }
};

// We don't really need downscaleImage on the main thread anymore if we route everything through the worker,
// but for API compatibility we can keep it or also route it to the worker.
// The current scaleImage implementation in the worker handles downscaling too.

export const downscaleImage = async (source: ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  // We can just use scaleImage which handles downscaling if width/height >= targetSize
  return scaleImage(source, targetSize);
};

export default {
  downscaleImage,
  scaleImage,
  releasePool
};
