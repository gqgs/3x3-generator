import downscale from "downscale"
import { UpscaleWorker } from "../types"

export const scaleImage = async (image: ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  const min = Math.min(image.width, image.height)
  if (min > targetSize) {
    return downscaleImage(image, targetSize)
  }
  if (min < targetSize) {
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    canvas.getContext("2d")?.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)
    const upscaled = await upscaleImage(canvas)
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

const has_offscreen_canvas_support = typeof OffscreenCanvas === "function"

const loadUpscaleWorker = (async () => {
  const Worker = (await (has_offscreen_canvas_support ? import("worker-loader!./upscale.worker") : import("./cugan"))).default
  return new Worker()
})()

const upscaleImagefallback = async (canvas: HTMLCanvasElement) : Promise<ImageBitmap> => {
  const [worker, bitmap] = await Promise.all([loadUpscaleWorker as Promise<UpscaleWorker>, createImageBitmap(canvas, 0, 0, canvas.width, canvas.height)])
  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = 332
  outputCanvas.height = 332
  return await worker.predict(bitmap, outputCanvas)
}

const upscaleImage = async (canvas: HTMLCanvasElement) : Promise<ImageBitmap> => {
  if (!has_offscreen_canvas_support) {
    return upscaleImagefallback(canvas)
  }

  const [worker, bitmap] = await Promise.all([loadUpscaleWorker as Promise<Worker>, createImageBitmap(canvas, 0, 0, canvas.width, canvas.height)])
  return new Promise(resolve => {
    worker.onmessage = (event: MessageEvent) => {
      const { upscaled } = event.data
      resolve(upscaled)
    }

    worker.postMessage({
      bitmap
    })
  })
}

export default {
  downscaleImage,
  scaleImage
}
