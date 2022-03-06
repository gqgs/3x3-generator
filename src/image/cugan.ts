import * as tf from "@tensorflow/tfjs"
import { UpscaleWorker } from "../types"

export default class Cugan2x implements UpscaleWorker {
  public async predict (pixels: ImageBitmap, canvas: HTMLCanvasElement | OffscreenCanvas | null = null): Promise<ImageBitmap> {
    const path = `${process.env.BASE_URL}tfjs_models/model.json`
    const model = await tf.loadGraphModel(path)
    const tidy = tf.tidy(() => {
      const img = tf.browser.fromPixels(pixels).toFloat()
      const offset = tf.scalar(255)
      const normalized = img.div(offset)
      const batched = normalized.reshape([1, 200, 200, 3])
      const pred = model.predict(batched) as tf.Tensor4D
      const tensor = pred.squeeze() as tf.Tensor3D
      return tensor.clipByValue(0, 1)
    })

    if (!canvas) {
      canvas = new OffscreenCanvas(332, 332)
    }
    canvas.getContext("2d")
    const as3D = tidy.as3D(332, 332, 3)
    await tf.browser.toPixels(as3D, canvas as unknown as HTMLCanvasElement)

    as3D.dispose()
    tidy.dispose()
    model.dispose()

    return createImageBitmap(canvas)
  }
}
