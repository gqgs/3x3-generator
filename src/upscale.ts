import Waifu2x, { Model } from "./waifu2x"

const has_offscreen_canvas_support = typeof document.createElement("canvas").transferControlToOffscreen === "function"

const loadWorker = (async () => {
  const Worker = (await (has_offscreen_canvas_support ? import("worker-loader!./waifu2x.worker") : import("./waifu2x"))).default
  return new Worker()
})()

const upscalefallback = async (canvas: HTMLCanvasElement, denoiseModel: Model, upscaleModel: Model) : Promise<ImageBitmap> => {
  const [worker, bitmap] = await Promise.all([loadWorker as Promise<Waifu2x>, createImageBitmap(canvas, 0, 0, canvas.width, canvas.height)])
  const denoised = await worker.predict(denoiseModel, bitmap)
  const upscaled = await worker.predict(upscaleModel, denoised)
  return upscaled
}

export const upscale = async (canvas: HTMLCanvasElement, denoiseModel: Model, upscaleModel: Model = "scale2.0x_model.json") : Promise<ImageBitmap> => {
  if (!has_offscreen_canvas_support) {
    return upscalefallback(canvas, denoiseModel, upscaleModel)
  }

  const [worker, bitmap] = await Promise.all([loadWorker as Promise<Worker>, createImageBitmap(canvas, 0, 0, canvas.width, canvas.height)])
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
  upscale
}
