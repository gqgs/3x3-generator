import { UpscaleWorker } from "../types"
import * as ort from "onnxruntime-web"

export default class Cugan2x implements UpscaleWorker {
  models: Map<string, Promise<ort.InferenceSession>> = new Map<string, Promise<ort.InferenceSession>>()

  constructor () {
    ort.env.wasm.wasmPaths = `${process.env.BASE_URL}js/`
  }

  private async loadModel(denoiseModel: string): Promise<ort.InferenceSession> {
    const cached_model = this.models.get(denoiseModel)
    if (cached_model) {
      return cached_model
    }
    const path = `${process.env.BASE_URL}models/up2x-latest-${denoiseModel}.onnx`
    const model = ort.InferenceSession.create(path, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
      executionMode: "parallel"
    })
    this.models.set(denoiseModel, model)
    return model
  }

  public async predict (img: ImageData, denoiseModel: string): Promise<ImageBitmap> {
    const red = new Array<number>()
    const green = new Array<number>()
    const blue = new Array<number>()
    for (let i = 0; i < img.data.length; i += 4) {
      red.push(img.data[i])
      green.push(img.data[i+1])
      blue.push(img.data[i+2])
    }
    const transposed = red.concat(green).concat(blue)
    const float32Data = new Float32Array(3 * 200 * 200)
    for (let i = 0; i < float32Data.length; i++) {
      float32Data[i] = transposed[i] / 255.0
    }
    const tensor = new ort.Tensor("float32", float32Data, [1, 3, 200, 200])
    const session = await this.loadModel(denoiseModel)
    const feeds = { input_1: tensor }
    const results = await session.run(feeds)

    const rgbaArray = new Uint8ClampedArray(4 * 400 * 400)
    const resultData = results.output_1.data as Uint8Array
    // [3, 400, 400] -> [400, 400, 4]
    for (const d of Array(4).keys()) {
      for (let i = 160_000 * d, j = d; j < rgbaArray.length; i++, j += 4) {
        rgbaArray[j] = resultData[i] ?? 255
      }
    }
    const bitmap = new ImageData(rgbaArray, 400, 400)
    return createImageBitmap(bitmap)
  }
}
