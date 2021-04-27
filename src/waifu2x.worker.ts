import waifu2x from './waifu2x'
import * as tf from '@tensorflow/tfjs'

let model: tf.GraphModel | null = null

// eslint-disable-next-line
const cctx: Worker = self as any

onmessage = async (event: MessageEvent) => {
  const width = event.data.width
  const height = event.data.height
  const image_data = event.data.image_data

  if (model === null) {
    model = await waifu2x.loadModel()
  }
  const upscale_canvas = new OffscreenCanvas(width * 2, height * 2)
  const ctx = upscale_canvas.getContext('2d')
  if (ctx == null) return
  await waifu2x.enlarge(image_data, ctx, model)
  const blob = await upscale_canvas.convertToBlob()
  cctx.postMessage({
    blob
  })
}
