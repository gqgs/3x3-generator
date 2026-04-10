import * as ort from "onnxruntime-web";

// Configure ONNX Runtime for high-performance WASM
const BASE_URL = process.env.NODE_ENV === "production" ? "/3x3-generator/" : "/";
ort.env.wasm.wasmPaths = `${BASE_URL}js/`;
// WASM multi-threading is key for CPU performance
ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 8);
ort.env.wasm.proxy = false;

let session: ort.InferenceSession | null = null;
let currentModelPath: string | null = null;

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

const getSession = async (modelType: '6B' | 'Swin2SR') => {
  const config = getModelConfig(modelType);
  const modelPath = config.path;

  if (!session || currentModelPath !== modelPath) {
    if (session) await session.release();
    session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    currentModelPath = modelPath;
  }
  return { session, config };
};

/**
 * Tiled Upscaling Implementation (WASM Optimized)
 */
const upscaleTiled = async (bitmap: ImageBitmap, modelType: '6B' | 'Swin2SR'): Promise<ImageBitmap> => {
  const { session: sess, config } = await getSession(modelType);
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

  const processTile = async (x: number, y: number) => {
    const curW = Math.min(TILE_SIZE, width - x);
    const curH = Math.min(TILE_SIZE, height - y);
    
    // Extract tile data
    const tileData = ctx.getImageData(x, y, TILE_SIZE, TILE_SIZE);
    const { data } = tileData;

    // Preprocess: NCHW Float32 (normalized to [0, 1])
    // The model is INT8 internally but the input tensor is expected to be Float32
    const inputBuffer = new Float32Array(3 * TILE_SIZE * TILE_SIZE);
    for (let i = 0; i < TILE_SIZE * TILE_SIZE; i++) {
      inputBuffer[i] = data[i * 4] / 255;           // R
      inputBuffer[i + TILE_SIZE * TILE_SIZE] = data[i * 4 + 1] / 255;   // G
      inputBuffer[i + 2 * TILE_SIZE * TILE_SIZE] = data[i * 4 + 2] / 255; // B
    }

    const tensor = new ort.Tensor("float32", inputBuffer, [1, 3, TILE_SIZE, TILE_SIZE]);
    const feeds: Record<string, ort.Tensor> = { [sess.inputNames[0]]: tensor };
    
    const results = await sess.run(feeds);
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
  };

  for (let y = 0; y < height; y += TILE_SIZE) {
    for (let x = 0; x < width; x += TILE_SIZE) {
      await processTile(x, y);
    }
  }

  return createImageBitmap(outputCanvas);
};

export const scaleImage = async (bitmap: ImageBitmap, targetSize: number, modelType: '6B' | 'Swin2SR' = '6B'): Promise<ImageBitmap> => {
  if (bitmap.width >= targetSize && bitmap.height >= targetSize) {
    return downscaleImage(bitmap, targetSize);
  }
  const upscaled = await upscaleTiled(bitmap, modelType);
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
  scaleImage
};
