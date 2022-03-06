import * as tf from "@tensorflow/tfjs"
import * as tflite from "@tensorflow/tfjs-tflite"
import { UpscaleWorker } from "../types"

export default class Cugan2x implements UpscaleWorker {
  model: Promise<tflite.TFLiteModel>

  constructor () {
    const path = `${process.env.BASE_URL}tfjs_models/model.tflite`
    this.model = tflite.loadTFLiteModel(path)
  }

  public async predict (pixels: ImageBitmap, canvas: HTMLCanvasElement | OffscreenCanvas | null = null): Promise<ImageBitmap> {
    const model = await this.model
    const tidy = tf.tidy(() => {
      const img = tf.browser.fromPixels(pixels).toFloat()
      const offset = tf.scalar(255)
      const normalized = img.divNoNan(offset)
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
    return createImageBitmap(canvas)
  }
}
