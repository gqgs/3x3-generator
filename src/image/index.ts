import { Upscaler } from "upscalejs"
import { Jimp } from "jimp";

const MIME_PNG = "image/png"

const resizeBitmap = async (bitmap: ImageBitmap, targetSize: number): Promise<Blob> => {
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw Error("couldn't get canvas context")

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const image = await Jimp.fromBitmap(imageData);

  const target = parseInt(`${targetSize}`)
  const resized = await image
  .resize({w: target, h: target})
  .getBuffer(MIME_PNG)

  return new Blob([resized], {type: MIME_PNG});
}

export const scaleImage = async (bitmap: ImageBitmap, targetSize: number, workerPool: Upscaler): Promise<ImageBitmap> => {
  const min = Math.min(bitmap.width, bitmap.height)
  if (min > targetSize) {
    return downscaleImage(bitmap, targetSize)
  }
  if (min < targetSize) {
    const blob = await resizeBitmap(bitmap, 200)
    return upscaleImage(blob, workerPool)
  }
  // min === targetSize
  return Promise.resolve(bitmap)
}

export const downscaleImage = async (source: ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  const resized = await resizeBitmap(source, targetSize)
  return createImageBitmap(resized, 0, 0, targetSize, targetSize)
}

const upscaleImage = async (canvas: HTMLCanvasElement | Blob, workerPool: Upscaler) : Promise<ImageBitmap> => {
  return createImageBitmap(await workerPool.upscale(await createImageBitmap(canvas)))
}

export default {
  downscaleImage,
  scaleImage
}
