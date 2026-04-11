import * as ort from "onnxruntime-web";

// Configure ONNX Runtime inside the worker
ort.env.wasm.proxy = false;
// Enable multi-threading if possible
ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 3, 9);

const ctx: DedicatedWorkerGlobalScope = self as any;

// Types
type ModelType = '6B' | 'Swin2SR';

interface ScaleMessage {
  id: string;
  type: 'scale';
  bitmap: ImageBitmap;
  targetSize: number;
  modelType: ModelType;
  baseUrl: string;
}

interface ReleaseMessage {
  type: 'release';
}

type WorkerMessage = ScaleMessage | ReleaseMessage;

// POOL CONFIGURATION
const POOL_SIZE = 3;
const sessions: Record<string, (ort.InferenceSession | null)[]> = {
  '6B': Array(POOL_SIZE).fill(null),
  'Swin2SR': Array(POOL_SIZE).fill(null)
};

const availableIndices: Record<string, number[]> = {
  '6B': [0],
  'Swin2SR': [0]
};

const waitingResolvers: Record<string, ((index: number) => void)[]> = {
  '6B': [],
  'Swin2SR': []
};

const getModelConfig = (modelType: ModelType, baseUrl: string) => {
  if (modelType === 'Swin2SR') {
    return {
      path: `${baseUrl}models/Swin2SR/swin2SR_uint8.ort`,
      tileSize: 64,
      upscaleFactor: 2
    };
  }
  return {
    path: `${baseUrl}models/RealESRGAN/RealESRGAN_x4plus_anime_6B_uint8.ort`,
    tileSize: 256,
    upscaleFactor: 4
  };
};

const acquireSession = async (modelType: ModelType, baseUrl: string): Promise<{ session: ort.InferenceSession, index: number }> => {
  let index: number;
  
  // Safety check for unexpected modelType
  const effectiveModelType = availableIndices[modelType] ? modelType : '6B';
  
  if (availableIndices[effectiveModelType].length > 0) {
    index = availableIndices[effectiveModelType].shift()!;
  } else {
    index = await new Promise<number>(resolve => {
      waitingResolvers[effectiveModelType].push(resolve);
    });
  }
  
  const config = getModelConfig(effectiveModelType, baseUrl);
  if (!sessions[effectiveModelType][index]) {
    sessions[effectiveModelType][index] = await ort.InferenceSession.create(config.path, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
  }
  
  return { session: sessions[effectiveModelType][index]!, index };
};

const releaseSession = (modelType: ModelType, index: number) => {
  const effectiveModelType = availableIndices[modelType] ? modelType : '6B';
  if (waitingResolvers[effectiveModelType].length > 0) {
    const nextResolver = waitingResolvers[effectiveModelType].shift()!;
    nextResolver(index);
  } else {
    availableIndices[effectiveModelType].push(index);
  }
};

const upscaleTiled = async (
  bitmap: ImageBitmap, 
  modelType: ModelType,
  baseUrl: string,
  onProgress?: (percent: number) => void
): Promise<ImageBitmap> => {
  const { session: sess, index } = await acquireSession(modelType, baseUrl);
  const config = getModelConfig(modelType, baseUrl);
  
  try {
    const { width, height } = bitmap;
    const TILE_SIZE = config.tileSize;
    const UPSCALE_FACTOR = config.upscaleFactor;
    const OUT_TILE_SIZE = TILE_SIZE * UPSCALE_FACTOR;
    
    const canvas = new OffscreenCanvas(width, height);
    const ctx2d = canvas.getContext("2d", { alpha: false, willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
    if (!ctx2d) throw new Error("Could not get canvas context");
    ctx2d.drawImage(bitmap, 0, 0);

    const outputCanvas = new OffscreenCanvas(width * UPSCALE_FACTOR, height * UPSCALE_FACTOR);
    const outCtx = outputCanvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
    if (!outCtx) throw new Error("Could not get output canvas context");

    const tileCanvas = new OffscreenCanvas(OUT_TILE_SIZE, OUT_TILE_SIZE);
    const tileCtx = tileCanvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;

    const tilesX = Math.ceil(width / TILE_SIZE);
    const tilesY = Math.ceil(height / TILE_SIZE);
    const totalTiles = tilesX * tilesY;
    let finishedTiles = 0;

    for (let y = 0; y < height; y += TILE_SIZE) {
      for (let x = 0; x < width; x += TILE_SIZE) {
        const curW = Math.min(TILE_SIZE, width - x);
        const curH = Math.min(TILE_SIZE, height - y);
        
        const tileData = ctx2d.getImageData(x, y, TILE_SIZE, TILE_SIZE);
        const { data } = tileData;

        const inputBuffer = new Float32Array(3 * TILE_SIZE * TILE_SIZE);
        for (let i = 0; i < TILE_SIZE * TILE_SIZE; i++) {
          inputBuffer[i] = data[i * 4] / 255;
          inputBuffer[i + TILE_SIZE * TILE_SIZE] = data[i * 4 + 1] / 255;
          inputBuffer[i + 2 * TILE_SIZE * TILE_SIZE] = data[i * 4 + 2] / 255;
        }

        const tensor = new ort.Tensor("float32", inputBuffer, [1, 3, TILE_SIZE, TILE_SIZE]);
        const results = await sess.run({ [sess.inputNames[0]]: tensor });
        const output = results[sess.outputNames[0]].data as Float32Array;

        const outImageData = new Uint8ClampedArray(OUT_TILE_SIZE * OUT_TILE_SIZE * 4);
        for (let i = 0; i < OUT_TILE_SIZE * OUT_TILE_SIZE; i++) {
          outImageData[i * 4] = Math.max(0, Math.min(255, output[i] * 255));
          outImageData[i * 4 + 1] = Math.max(0, Math.min(255, output[i + OUT_TILE_SIZE * OUT_TILE_SIZE] * 255));
          outImageData[i * 4 + 2] = Math.max(0, Math.min(255, output[i + 2 * OUT_TILE_SIZE * OUT_TILE_SIZE] * 255));
          outImageData[i * 4 + 3] = 255;
        }

        tileCtx.putImageData(new ImageData(outImageData, OUT_TILE_SIZE, OUT_TILE_SIZE), 0, 0);
        outCtx.drawImage(
          tileCanvas,
          0, 0, curW * UPSCALE_FACTOR, curH * UPSCALE_FACTOR,
          x * UPSCALE_FACTOR, y * UPSCALE_FACTOR, curW * UPSCALE_FACTOR, curH * UPSCALE_FACTOR
        );

        finishedTiles++;
        if (onProgress) onProgress((finishedTiles / totalTiles) * 100);
      }
    }

    return outputCanvas.transferToImageBitmap();
  } finally {
    releaseSession(modelType, index);
  }
};

const downscaleImage = async (source: ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  const canvas = new OffscreenCanvas(targetSize, targetSize);
  const ctx2d = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
  if (!ctx2d) throw new Error("Could not get context");
  ctx2d.imageSmoothingEnabled = true;
  ctx2d.imageSmoothingQuality = "high";
  ctx2d.drawImage(source, 0, 0, targetSize, targetSize);
  return canvas.transferToImageBitmap();
};

const releasePool = async () => {
  for (const modelType of Object.keys(sessions)) {
    for (let i = 0; i < POOL_SIZE; i++) {
      if (sessions[modelType][i]) {
        await sessions[modelType][i]!.release();
        sessions[modelType][i] = null;
      }
    }
    availableIndices[modelType] = Array.from({ length: POOL_SIZE }, (_, i) => i);
    waitingResolvers[modelType] = [];
  }
};

ctx.addEventListener('message', async (e: MessageEvent<WorkerMessage>) => {
  const data = e.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'release') {
    await releasePool();
    return;
  }

  if (data.type === 'scale') {
    const { id, bitmap, targetSize, modelType, baseUrl } = data;
    
    // Configure ONNX Runtime
    ort.env.wasm.wasmPaths = `${baseUrl}js/`;

    try {
      let resultBitmap: ImageBitmap;
      if (bitmap.width >= targetSize && bitmap.height >= targetSize) {
        ctx.postMessage({ id, type: 'progress', percent: 100 });
        resultBitmap = await downscaleImage(bitmap, targetSize);
      } else {
        const upscaled = await upscaleTiled(bitmap, modelType, baseUrl, (percent) => {
          ctx.postMessage({ id, type: 'progress', percent });
        });
        
        if (upscaled.width !== targetSize || upscaled.height !== targetSize) {
          resultBitmap = await downscaleImage(upscaled, targetSize);
          upscaled.close();
        } else {
          resultBitmap = upscaled;
        }
      }
      
      ctx.postMessage({ id, type: 'done', bitmap: resultBitmap }, [resultBitmap]);
    } catch (error: any) {
      console.error("Worker scaling error:", error);
      ctx.postMessage({ id, type: 'error', error: error.message || String(error) });
    } finally {
      bitmap.close();
    }
  }
});
