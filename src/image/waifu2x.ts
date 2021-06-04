import { Predictor } from "waifu2x-tfjs"

export type Model =
    "denoise0_model.json" |
    "denoise1_model.json" |
    "denoise2_model.json" |
    "denoise3_model.json" |
    "scale2.0x_model.json"

export default class Waifu2x {
  private models: { [model in Model]?: Predictor } = {}
  private start_model (model: Model): Predictor {
    const cached = this.models[model]
    if (cached === undefined) {
      const path = `${process.env.BASE_URL}tfjs_models/${model}`
      const predictor = new Predictor(path)
      this.models[model] = predictor
      return predictor
    }
    return cached
  }

  public predict (model: Model, image: ImageBitmap): Promise<ImageBitmap> {
    let predictor = this.models[model]
    if (predictor === undefined) {
      predictor = this.start_model(model)
    }
    return predictor.predict(image, model.startsWith("denoise"))
  }

  public progress (model: Model, listener: (ratio: number) => void): void {
    let predictor = this.models[model]
    if (predictor === undefined) {
      predictor = this.start_model(model)
    }
    predictor.listenToModelPredictProgress(listener)
  }

  public destroy (): void {
    Object.keys(this.models).forEach(model => {
      this.models[model as Model]?.destroy()
      delete this.models[model as Model]
    })
  }
}
