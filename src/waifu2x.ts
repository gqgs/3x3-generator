import * as tf from '@tensorflow/tfjs'
import { UpscaleImage } from './types'

interface ModelInfo {
  dir_name: string
  patch_size: number
  margin_size: number
  padding_method: string
  upscale_first: boolean
}

const MODEL_INFO: {[key: string] : ModelInfo} = {
  'UpConv-7': {
    dir_name: 'waifu2x_upconv_7_noise1_scale2.0x_same_padding_model',
    patch_size: 128,
    margin_size: 6,
    padding_method: 'SAME',
    upscale_first: false
  }
}

const defaultModel = MODEL_INFO['UpConv-7']

function enlarge (original_image: HTMLImageElement | ImageData,
  model: tf.GraphModel,
  model_info: ModelInfo = defaultModel
): Promise<UpscaleImage[]> {
  return new Promise(async resolve => {
  /* eslint-disable no-console */
    console.log(`memory used before processing: ${tf.memory().numBytes / 1024} KiB`)

    const margin_size = model_info.margin_size
    const patch_size = model_info.patch_size
    const padding_method = model_info.padding_method
    const upscale_first = model_info.upscale_first

    // reshape to: [1, h, w, 3] and normalize
    const input = tf.tidy(
      () => tf.browser.fromPixels(original_image) // int32, 3 channels
        .expandDims()
        .asType('float32')
        .div(255.0)
    )

    const [b, h, w, c] = input.shape
    const [padded_h, padded_w] = [h + 2 * margin_size, w + 2 * margin_size]
    const upscaled: UpscaleImage[] = []

    // pad the input image tensor
    const padded_input = tf.tidy(() => {
      const h_padded_input = tf.concat([tf.tile(tf.slice(input, [0, 0, 0, 0], [b, 1, w, c]), [1, margin_size, 1, 1]),
        input,
        tf.tile(tf.slice(input, [0, h - 1, 0, 0], [b, 1, w, c]), [1, margin_size, 1, 1])
      ],
      1)
      return tf.concat([tf.tile(tf.slice(h_padded_input, [0, 0, 0, 0], [b, padded_h, 1, c]), [1, 1, margin_size, 1]),
        h_padded_input,
        tf.tile(tf.slice(h_padded_input, [0, 0, w - 1, 0], [b, padded_h, 1, c]), [1, 1, margin_size, 1])
      ],
      2)
    })

    // split the padded image into overlapped patches
    const overlapped_patch_size = patch_size + 2 * margin_size
    const overlapped_patches = new Array(Math.ceil(h / patch_size)).fill(0)
      .map(() => new Array(Math.ceil(w / patch_size)).fill(0))
      .map((r, i, rows) =>
        r.map((v, j, row) =>
          tf.slice(padded_input,
            [0, i * patch_size, j * patch_size, 0],
            [b,
              i < rows.length - 1 ? overlapped_patch_size : padded_h - i * patch_size,
              j < row.length - 1 ? overlapped_patch_size : padded_w - j * patch_size,
              c])))

    for (let i = 0; i < overlapped_patches.length; i++) {
      const row = overlapped_patches[i]
      for (let j = 0; j < row.length; j++) {
        const overlapped_patch = row[j]
        const enlarged_patch_pixels = tf.tidy(() => {
          const enlarged_overlapped_patch_pixels = (model.predict(overlapped_patch) as tf.Tensor).squeeze()
          const [eop_h, eop_w, eop_c] = enlarged_overlapped_patch_pixels.shape
          switch (padding_method) {
            case 'VALID':
              if (upscale_first) {
                return enlarged_overlapped_patch_pixels
                  .slice([margin_size, margin_size, 0],
                    [eop_h - 2 * margin_size, eop_w - 2 * margin_size, eop_c])
              } else {
                return enlarged_overlapped_patch_pixels
                  .slice([0, 0, 0],
                    [eop_h, eop_w, eop_c])
              }
            case 'SAME':
              return enlarged_overlapped_patch_pixels
                .slice([2 * margin_size, 2 * margin_size, 0],
                  [eop_h - 4 * margin_size, eop_w - 4 * margin_size, eop_c])
          }
        })
        if (enlarged_patch_pixels === undefined) {
          throw new Error('`enlarged_patch_pixels` undefined')
        }
        const [enlarged_patch_h, enlarged_patch_w] = enlarged_patch_pixels.shape
        const enlarged_patch_bytes = await tf.browser.toPixels(enlarged_patch_pixels as tf.Tensor2D)
        enlarged_patch_pixels.dispose()
        overlapped_patch.dispose()

        const enlarged_patch_image_data = new ImageData(enlarged_patch_bytes,
          enlarged_patch_w,
          enlarged_patch_h)

        upscaled.push({
          image: enlarged_patch_image_data,
          x: 2 * j * patch_size,
          y: 2 * i * patch_size
        })
      }
    }

    tf.dispose(padded_input)
    tf.dispose(input)

    resolve(upscaled)

    /* eslint-disable no-console */
    console.log(`memory used after processing: ${tf.memory().numBytes / 1024} KiB`)
  })
}
export default {
  enlarge,
  async loadModel ({ dir_name }: ModelInfo = defaultModel): Promise<tf.GraphModel> {
    const modelPath = `${process.env.BASE_URL}tfjs_models/${dir_name}/model.json`
    return await tf.loadGraphModel(modelPath)
  }
}
