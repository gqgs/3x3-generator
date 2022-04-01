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
  return new Promise(resolve => {
    const canvas = document.createElement("canvas")
    canvas.width = source.width
    canvas.height = source.height
    canvas.getContext("2d")?.drawImage(source, 0, 0, source.width, source.height, 0, 0, source.width, source.height)
    const img = new Image()
    img.onload = async () => {
      const result = document.createElement("canvas")
      result.width = targetSize
      result.height = targetSize
      const resized = await resizer.resize(img, result)
      resolve(await createImageBitmap(resized, 0, 0, targetSize, targetSize))
    }
    img.src = canvas.toDataURL("image/png")
  })
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
