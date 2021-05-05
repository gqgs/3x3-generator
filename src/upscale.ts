import Waifu2x, { Model } from "./waifu2x"
import { ref } from "vue"
import WebpackWorker from "worker-loader!*"
export const upscaling = ref(false)
export const progress = ref(0)
export const progress_msg = ref("Starting...")

const has_offscreen_canvas_support = typeof document.createElement("canvas").transferControlToOffscreen === "function"

let worker: WebpackWorker | Waifu2x

const loadWorker = new Promise<void>(async resolve => {
  if (has_offscreen_canvas_support) {
    const Waifu2xWorker = (await import("worker-loader!./waifu2x.worker")).default
    worker = new Waifu2xWorker()
  } else {
    const Waifu2xConstructor = (await import("./waifu2x")).default
    worker = new Waifu2xConstructor()
  }
  resolve()
})

const updateProgress = (msg: string) => (value: number) => {
  progress.value = value
  progress_msg.value = msg
}

const canvasFromUpscaled = (upscaled: ImageBitmap) : HTMLCanvasElement => {
  const canvas = document.createElement("canvas")
  canvas.width = upscaled.width
  canvas.height = upscaled.height

  const ctx = canvas.getContext("bitmaprenderer")
  if (ctx) {
    ctx.transferFromImageBitmap(upscaled)
  } else {
    canvas.getContext("2d")?.drawImage(upscaled, 0, 0)
  }
  upscaling.value = false
  progress.value = 0
  return canvas
}

const upscalefallback = (canvas: HTMLCanvasElement, denoiseModel: Model, upscaleModel: Model) : Promise<HTMLCanvasElement> => {
  return new Promise(async (resolve) => {
    const bitmap = await createImageBitmap(canvas, 0, 0, canvas.width, canvas.height)
    await loadWorker
    worker = worker as Waifu2x
    worker.progress(denoiseModel, updateProgress("Denoising image..."))
    worker.progress(upscaleModel, updateProgress("Upscaling image..."))
    const denoised = await worker.predict(denoiseModel, bitmap)
    const upscaled = await worker.predict(upscaleModel, denoised)
    resolve(canvasFromUpscaled(upscaled))
  })
}

export const upscale = (canvas: HTMLCanvasElement, denoiseModel: Model, upscaleModel: Model = "scale2.0x_model.json") : Promise<HTMLCanvasElement> => {
  upscaling.value = true

  if (!has_offscreen_canvas_support) {
    return upscalefallback(canvas, denoiseModel, upscaleModel)
  }

  return new Promise(async resolve => {
    await loadWorker
    worker = worker as Worker
    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === "progress") {
        updateProgress(event.data.msg)(event.data.value)
        return
      }
      const { upscaled } = event.data
      resolve(canvasFromUpscaled(upscaled))
    }

    worker.postMessage({
      bitmap: await createImageBitmap(canvas, 0, 0, canvas.width, canvas.height),
      denoiseModel,
      upscaleModel
    })
  })
}

export default {
  upscaling,
  upscale,
  progress,
  progress_msg
}
