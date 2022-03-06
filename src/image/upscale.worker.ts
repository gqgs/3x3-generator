import Cugan2x from "./cugan"

// eslint-disable-next-line
const ctx: Worker = self as any
let worker: Cugan2x | null = null

onmessage = async (event: MessageEvent) => {
  const bitmap = event.data.bitmap

  if (worker == null) worker = new Cugan2x()
  const upscaled = await worker.predict(bitmap)

  ctx.postMessage({
    type: "done",
    upscaled
  })
}
