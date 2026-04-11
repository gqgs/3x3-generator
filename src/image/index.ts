import * as ort from "onnxruntime-web";

// Configure ONNX Runtime on main thread to NOT use proxy
ort.env.wasm.proxy = false;

// Use a pool of workers for scaling to utilize multiple CPU cores
const BASE_URL = process.env.NODE_ENV === "production" ? "/3x3-generator/" : "/";
let workerCount = parseInt(localStorage.getItem("workerCount") || (navigator.hardwareConcurrency || 4).toString());

export const setWorkerCount = (count: number) => {
  if (workerCount !== count) {
    workerCount = count;
    // Terminate existing workers to re-initialize with new count if needed
    workers.forEach(w => w.terminate());
    workers = [];
    nextWorkerIndex = 0;
  }
};

export const getWorkerCount = () => workerCount;

let workers: Worker[] = [];
let nextWorkerIndex = 0;

const pendingJobs = new Map<string, {
  resolve: (bitmap: ImageBitmap) => void;
  reject: (error: Error) => void;
  onProgress?: (percent: number) => void;
}>();

let nextJobId = 0;

const getWorkers = () => {
  if (workers.length === 0) {
    console.log(`Creating ${workerCount} image workers`);
    for (let i = 0; i < workerCount; i++) {
      const w = new Worker(new URL('./image.worker.ts', import.meta.url));
      
      w.onmessage = (e) => {
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

      w.onerror = (e) => {
        console.error("Worker error event:", e);
      };

      workers.push(w);
    }
  }
  return workers;
};

export const scaleImage = async (
  bitmap: ImageBitmap, 
  targetSize: number, 
  modelType: '6B' | 'Swin2SR' = '6B',
  onProgress?: (percent: number) => void
): Promise<ImageBitmap> => {
  const pool = getWorkers();
  const w = pool[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % pool.length;

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
  if (workers.length > 0) {
    workers.forEach(w => w.postMessage({ type: 'release' }));
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
