import { upscale } from "./upscale"
import downscale from "downscale"
import { Model } from "./waifu2x"

export const downscaleImage = async (source: HTMLCanvasElement | ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  return new Promise(resolve => {
    const canvas = document.createElement("canvas")
    canvas.width = source.width
    canvas.height = source.height
    canvas.getContext("2d")?.drawImage(source, 0, 0, source.width, source.height, 0, 0, source.width, source.height)
    const img = new Image()
    img.onload = async () => {
      const downscaled = await downscale(img, targetSize, targetSize, { imageType: "png", returnCanvas: true })
      resolve(await createImageBitmap(downscaled, 0, 0, targetSize, targetSize))
    }
    img.src = canvas.toDataURL("image/png")
  })
}

export const scaleImage = async (image: ImageBitmap, targetSize: number, denoiseModel: Model): Promise<ImageBitmap> => {
  const min = Math.min(image.width, image.height)
  if (min > targetSize) {
    return downscaleImage(image, targetSize)
  }
  if (min < targetSize) {
    const canvas = document.createElement("canvas")
    canvas.width = image.width
    canvas.height = image.height
    canvas.getContext("2d")?.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)
    const upscaled = await upscale(canvas, denoiseModel)
    return downscaleImage(upscaled, targetSize)
  }
  // min === targetSize
  return Promise.resolve(image)
}

export default {
  downscaleImage,
  scaleImage
}
