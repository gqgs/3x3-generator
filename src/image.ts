import downscale from "downscale"
import Waifu2x, { Model } from "./waifu2x"

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
    const upscaled = await upscaleImage(canvas, denoiseModel)
    return downscaleImage(upscaled, targetSize)
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
      const downscaled = await downscale(img, targetSize, targetSize, { imageType: "png", returnCanvas: true })
      resolve(await createImageBitmap(downscaled, 0, 0, targetSize, targetSize))
    }
    img.src = canvas.toDataURL("image/png")
  })
}

const has_offscreen_canvas_support = typeof document.createElement("canvas").transferControlToOffscreen === "function"

const loadUpscaleWorker = (async () => {
  const Worker = (await (has_offscreen_canvas_support ? import("worker-loader!./waifu2x.worker") : import("./waifu2x"))).default
  return new Worker()
})()

const upscaleImagefallback = async (canvas: HTMLCanvasElement, denoiseModel: Model, upscaleModel: Model) : Promise<ImageBitmap> => {
  const [worker, bitmap] = await Promise.all([loadUpscaleWorker as Promise<Waifu2x>, createImageBitmap(canvas, 0, 0, canvas.width, canvas.height)])
  const denoised = await worker.predict(denoiseModel, bitmap)
  const upscaled = await worker.predict(upscaleModel, denoised)
  return upscaled
}

const upscaleImage = async (canvas: HTMLCanvasElement, denoiseModel: Model, upscaleModel: Model = "scale2.0x_model.json") : Promise<ImageBitmap> => {
  if (!has_offscreen_canvas_support) {
    return upscaleImagefallback(canvas, denoiseModel, upscaleModel)
  }

  const [worker, bitmap] = await Promise.all([loadUpscaleWorker as Promise<Worker>, createImageBitmap(canvas, 0, 0, canvas.width, canvas.height)])
  return new Promise(resolve => {
    worker.onmessage = (event: MessageEvent) => {
      const { upscaled } = event.data
      resolve(upscaled)
    }

    worker.postMessage({
      bitmap,
      denoiseModel,
      upscaleModel
    })
  })
}

export default {
  downscaleImage,
  scaleImage
}
