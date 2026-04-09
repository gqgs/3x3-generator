import * as ort from "onnxruntime-web";

// Configure ONNX Runtime
const BASE_URL = process.env.NODE_ENV === "production" ? "/3x3-generator/" : "/";
ort.env.wasm.wasmPaths = `${BASE_URL}js/`;
ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 8);
ort.env.wasm.proxy = false;

const MODEL_URL = `${BASE_URL}models/Xenova/swin2SR-lightweight-x2-64/onnx/model_uint8.onnx`;

let session: ort.InferenceSession | null = null;

const getSession = async () => {
  if (!session) {
    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    };
    session = await ort.InferenceSession.create(MODEL_URL, options);
  }
  return session;
};

/**
 * Tiled Upscaling Implementation (Inspired by upscalejs)
 * This breaks the image into 64x64 tiles, upscales each, and stitches them back.
 * This is 100x faster than upscaling a large image at once with a Transformer.
 */
const upscaleTiled = async (bitmap: ImageBitmap): Promise<ImageBitmap> => {
  const sess = await getSession();
  const { width, height } = bitmap;
  
  // Swin2SR x2 window size is 64
  const TILE_SIZE = 64;
  const UPSCALE_FACTOR = 2;
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

  // Reusable canvas to minimize GC pressure (cannot be transferred/detached)
  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = OUT_TILE_SIZE;
  tileCanvas.height = OUT_TILE_SIZE;
  const tileCtx = tileCanvas.getContext("2d", { alpha: false });

  // Process a single tile
  const processTile = async (x: number, y: number) => {
    const curW = Math.min(TILE_SIZE, width - x);
    const curH = Math.min(TILE_SIZE, height - y);
    
    // 1. Extract tile (pad if at edges to match TILE_SIZE)
    const tileData = ctx.getImageData(x, y, TILE_SIZE, TILE_SIZE);
    const { data } = tileData;

    // 2. Preprocess: Normalize to [0, 1] and convert to NCHW float32
    // We allocate a new buffer per tile because ORT's proxy mode transfers 
    // the buffer to the worker, detaching it from the main thread.
    const inputBuffer = new Float32Array(3 * TILE_SIZE * TILE_SIZE);
    for (let i = 0; i < TILE_SIZE * TILE_SIZE; i++) {
      inputBuffer[i] = data[i * 4] / 255;           // R
      inputBuffer[i + TILE_SIZE * TILE_SIZE] = data[i * 4 + 1] / 255;   // G
      inputBuffer[i + 2 * TILE_SIZE * TILE_SIZE] = data[i * 4 + 2] / 255; // B
    }

    // 3. Run Inference
    const tensor = new ort.Tensor("float32", inputBuffer, [1, 3, TILE_SIZE, TILE_SIZE]);
    const feeds: Record<string, ort.Tensor> = { [sess.inputNames[0]]: tensor };
    const results = await sess.run(feeds);
    const output = results[sess.outputNames[0]].data as Float32Array;

    // 4. Postprocess: Convert back to RGBA uint8
    const outImageData = new Uint8ClampedArray(OUT_TILE_SIZE * OUT_TILE_SIZE * 4);
    for (let i = 0; i < OUT_TILE_SIZE * OUT_TILE_SIZE; i++) {
      outImageData[i * 4] = Math.max(0, Math.min(255, output[i] * 255));
      outImageData[i * 4 + 1] = Math.max(0, Math.min(255, output[i + OUT_TILE_SIZE * OUT_TILE_SIZE] * 255));
      outImageData[i * 4 + 2] = Math.max(0, Math.min(255, output[i + 2 * OUT_TILE_SIZE * OUT_TILE_SIZE] * 255));
      outImageData[i * 4 + 3] = 255; // Alpha
    }

    // 5. Stitch tile back (crop edge tiles if they were padded)
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

export const scaleImage = async (bitmap: ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  // 1. Downscale case
  if (bitmap.width >= targetSize && bitmap.height >= targetSize) {
    return downscaleImage(bitmap, targetSize);
  }

  // 2. High-quality jump-start
  const jumpSize = targetSize / 2;
  let intermediate = bitmap;
  if (bitmap.width < jumpSize) {
    intermediate = await downscaleImage(bitmap, jumpSize);
  }

  // 3. Tiled AI Upscale (High speed)
  const upscaled = await upscaleTiled(intermediate);

  // 4. Final fit
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
