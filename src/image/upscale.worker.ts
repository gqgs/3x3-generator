import Cugan2x from "./cugan"

// eslint-disable-next-line
const ctx: Worker = self as any
let worker: Cugan2x | null = null

onmessage = async (event: MessageEvent) => {
  const id = event.data.id
  const bitmap = event.data.bitmap
  const denoiseModel = event.data.denoiseModel

  if (worker == null) worker = new Cugan2x()
  const upscaled = await worker.predict(bitmap, denoiseModel)

  ctx.postMessage({
    type: "done",
    upscaled,
    id
  })
}
