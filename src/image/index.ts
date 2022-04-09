import { UpscaleWorker } from "upscalejs"
import pica from "pica"

const resizer = new pica()

export const scaleImage = async (image: ImageBitmap, targetSize: number, workerPool: UpscaleWorker): Promise<ImageBitmap> => {
  const min = Math.min(image.width, image.height)
  if (min > targetSize) {
    return downscaleImage(image, targetSize)
  }
  if (min < targetSize) {
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    const resized = await resizer.resize(image, canvas)
    return upscaleImage(resized, workerPool)
  }
  // min === targetSize
  return Promise.resolve(image)
}

export const downscaleImage = async (source: HTMLCanvasElement | ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  const result = document.createElement("canvas")
  result.width = targetSize
  result.height = targetSize
  const resized = await resizer.resize(source, result)
  return createImageBitmap(resized, 0, 0, targetSize, targetSize)
}

const upscaleImage = async (canvas: HTMLCanvasElement, workerPool: UpscaleWorker) : Promise<ImageBitmap> => {
  return workerPool.upscale(await createImageBitmap(canvas))
}

export default {
  downscaleImage,
  scaleImage
}
