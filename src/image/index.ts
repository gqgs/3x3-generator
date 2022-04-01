import { workerPool } from "./worker_pool"
import pica from "pica"

const resizer = new pica()

export const scaleImageWithDoneCallback = async (image: ImageBitmap, targetSize: number, denoiseModel: string, callback: () => void): Promise<ImageBitmap> => {
  const result = await scaleImage(image, targetSize, denoiseModel)
  callback()
  return result
}

export const scaleImage = async (image: ImageBitmap, targetSize: number, denoiseModel: string): Promise<ImageBitmap> => {
  const min = Math.min(image.width, image.height)
  if (min > targetSize) {
    return downscaleImage(image, targetSize)
  }
  if (min < targetSize) {
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    const resized = await resizer.resize(image, canvas)
    return upscaleImage(resized, denoiseModel)
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

const upscaleImage = async (canvas: HTMLCanvasElement, denoiseModel: string) : Promise<ImageBitmap> => {
  const bitmap = canvas.getContext("2d")?.getImageData(0, 0, 200, 200)
  return new Promise(resolve => {
    workerPool.execute({
      bitmap,
      denoiseModel,
      resolve,
    })
  })
}

export default {
  downscaleImage,
  scaleImage
}
