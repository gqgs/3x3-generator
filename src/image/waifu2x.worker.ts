import Waifu2x from "./waifu2x"

// eslint-disable-next-line
const ctx: Worker = self as any
let worker: Waifu2x | null = null

onmessage = async (event: MessageEvent) => {
  const bitmap = event.data.bitmap
  const denoiseModel = event.data.denoiseModel
  const upscaleModel = event.data.upscaleModel

  if (worker === null) worker = new Waifu2x()
  const denoised = await worker.predict(denoiseModel, bitmap)
  const upscaled = await worker.predict(upscaleModel, denoised)

  ctx.postMessage({
    type: "done",
    upscaled
  })
}
