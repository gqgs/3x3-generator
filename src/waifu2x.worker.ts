import waifu2x from './waifu2x'
import * as tf from '@tensorflow/tfjs'

let model: tf.GraphModel | null = null

// eslint-disable-next-line
const cctx: Worker = self as any

onmessage = async (event: MessageEvent) => {
  const width = event.data.width * 2
  const height = event.data.height * 2
  const image_data = event.data.image_data

  if (model === null) {
    model = await waifu2x.loadModel()
  }

  const result = await waifu2x.enlarge(image_data, model)
  cctx.postMessage({
    result,
    width,
    height
  })
}
