import * as ort from "onnxruntime-web";

// Configure ONNX Runtime
const BASE_URL = process.env.NODE_ENV === "production" ? "/3x3-generator/" : "/";
ort.env.wasm.wasmPaths = `${BASE_URL}js/`;
ort.env.wasm.numThreads = 4;
ort.env.wasm.proxy = false;

// POOL CONFIGURATION
const POOL_SIZE = 3;
const sessions: Record<string, (ort.InferenceSession | null)[]> = {
  '6B': Array(POOL_SIZE).fill(null),
  'Swin2SR': Array(POOL_SIZE).fill(null)
};

// Available indices in the pool
const availableIndices: Record<string, number[]> = {
  '6B': [0, 1, 2],
  'Swin2SR': [0, 1, 2]
};

// Queue for those waiting for a session
const waitingResolvers: Record<string, ((index: number) => void)[]> = {
  '6B': [],
  'Swin2SR': []
};

/**
 * Releases all sessions in the pool
 */
export const releasePool = async () => {
  for (const modelType of Object.keys(sessions)) {
    for (let i = 0; i < POOL_SIZE; i++) {
      if (sessions[modelType][i]) {
        await sessions[modelType][i]!.release();
        sessions[modelType][i] = null;
      }
    }
    availableIndices[modelType] = [0, 1, 2];
    waitingResolvers[modelType] = [];
  }
};

const getModelConfig = (modelType: '6B' | 'Swin2SR') => {
  if (modelType === 'Swin2SR') {
    return {
      path: `${BASE_URL}models/Swin2SR/swin2SR_uint8.onnx`,
      tileSize: 64,
      upscaleFactor: 2
    };
  }
  return {
    path: `${BASE_URL}models/RealESRGAN/RealESRGAN_x4plus_anime_6B_uint8.onnx`,
    tileSize: 256,
    upscaleFactor: 4
  };
};

const acquireSession = async (modelType: '6B' | 'Swin2SR'): Promise<{ session: ort.InferenceSession, index: number }> => {
  let index: number;
  if (availableIndices[modelType].length > 0) {
    index = availableIndices[modelType].shift()!;
  } else {
    // Wait for a slot to become available
    index = await new Promise<number>(resolve => {
      waitingResolvers[modelType].push(resolve);
    });
  }
  
  const config = getModelConfig(modelType);
  if (!sessions[modelType][index]) {
    sessions[modelType][index] = await ort.InferenceSession.create(config.path, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
  }
  
  return { session: sessions[modelType][index]!, index };
};

const releaseSession = (modelType: '6B' | 'Swin2SR', index: number) => {
  if (waitingResolvers[modelType].length > 0) {
    const nextResolver = waitingResolvers[modelType].shift()!;
    nextResolver(index);
  } else {
    availableIndices[modelType].push(index);
  }
};

/**
 * Tiled Upscaling Implementation
 */
const upscaleTiled = async (
  bitmap: ImageBitmap, 
  modelType: '6B' | 'Swin2SR',
  onProgress?: (percent: number) => void
): Promise<ImageBitmap> => {
  const { session: sess, index } = await acquireSession(modelType);
  const config = getModelConfig(modelType);
  
  try {
    const { width, height } = bitmap;
    const TILE_SIZE = config.tileSize;
    const UPSCALE_FACTOR = config.upscaleFactor;
    const OUT_TILE_SIZE = TILE_SIZE * UPSCALE_FACTOR;
    
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(bitmap, 0, 0);

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = width * UPSCALE_FACTOR;
    outputCanvas.height = height * UPSCALE_FACTOR;
    const outCtx = outputCanvas.getContext("2d", { alpha: false });
    if (!outCtx) throw new Error("Could not get output canvas context");

    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = OUT_TILE_SIZE;
    tileCanvas.height = OUT_TILE_SIZE;
    const tileCtx = tileCanvas.getContext("2d", { alpha: false });

    const tilesX = Math.ceil(width / TILE_SIZE);
    const tilesY = Math.ceil(height / TILE_SIZE);
    const totalTiles = tilesX * tilesY;
    let finishedTiles = 0;

    for (let y = 0; y < height; y += TILE_SIZE) {
      for (let x = 0; x < width; x += TILE_SIZE) {
        const curW = Math.min(TILE_SIZE, width - x);
        const curH = Math.min(TILE_SIZE, height - y);
        
        const tileData = ctx.getImageData(x, y, TILE_SIZE, TILE_SIZE);
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

        if (tileCtx) {
          tileCtx.putImageData(new ImageData(outImageData, OUT_TILE_SIZE, OUT_TILE_SIZE), 0, 0);
          outCtx.drawImage(
            tileCanvas,
            0, 0, curW * UPSCALE_FACTOR, curH * UPSCALE_FACTOR,
            x * UPSCALE_FACTOR, y * UPSCALE_FACTOR, curW * UPSCALE_FACTOR, curH * UPSCALE_FACTOR
          );
        }

        finishedTiles++;
        if (onProgress) onProgress((finishedTiles / totalTiles) * 100);
      }
    }

    return createImageBitmap(outputCanvas);
  } finally {
    releaseSession(modelType, index);
  }
};

export const scaleImage = async (
  bitmap: ImageBitmap, 
  targetSize: number, 
  modelType: '6B' | 'Swin2SR' = '6B',
  onProgress?: (percent: number) => void
): Promise<ImageBitmap> => {
  if (bitmap.width >= targetSize && bitmap.height >= targetSize) {
    if (onProgress) onProgress(100);
    return downscaleImage(bitmap, targetSize);
  }
  const upscaled = await upscaleTiled(bitmap, modelType, onProgress);
  if (upscaled.width !== targetSize || upscaled.height !== targetSize) {
    return downscaleImage(upscaled, targetSize);
  }
  return upscaled;
};

export const downscaleImage = async (source: ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not get context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, targetSize, targetSize);
  return createImageBitmap(canvas);
};

export default {
  downscaleImage,
  scaleImage,
  releasePool
};
