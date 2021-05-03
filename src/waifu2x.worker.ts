import Waifu2x from "./waifu2x"

// eslint-disable-next-line
const ctx: Worker = self as any
let worker: Waifu2x | null = null

onmessage = async (event: MessageEvent) => {
  const bitmap = event.data.bitmap
  const denoiseModel = event.data.denoiseModel
  const upscaleModel = event.data.upscaleModel

  const progress = (msg: string) => (value: number) => {
    ctx.postMessage({
      type: "progress",
      value: value * 100,
      msg
    })
  }

  if (worker === null) worker = new Waifu2x()
  worker.progress(denoiseModel, progress("Denoising image..."))
  worker.progress(upscaleModel, progress("Upscaling image..."))
  const denoised = await worker.predict(denoiseModel, bitmap)
  const upscaled = await worker.predict(upscaleModel, denoised)

  ctx.postMessage({
    type: "done",
    upscaled
  })
}
