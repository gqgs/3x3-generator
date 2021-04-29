
import Worker from 'worker-loader!./waifu2x.worker'
import waifu2x from './waifu2x'
import { ref } from 'vue'
import { UpscaleImage } from './types'

export const upscaling = ref(false)
export const progress = ref(0)

let upscaleWorker: Worker | null = null

const has_offscreen_canvas_support = typeof document.createElement('canvas').transferControlToOffscreen === 'function'

const updateProgress = (value: number) => {
  progress.value = value
}

const processResult = (result: UpscaleImage[], width: number, height: number) : Promise<HTMLCanvasElement> => {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    result.forEach(({ image, x, y }: UpscaleImage) => {
      ctx?.putImageData(image, x, y)
    })
    upscaling.value = false
    progress.value = 0
    resolve(canvas)
  })
}

const upscalefallback = (canvas: HTMLCanvasElement) : Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = async () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')
      ctx?.drawImage(img, 0, 0, img.width, img.height)

      const image_data = ctx?.getImageData(0, 0, img.width, img.height)
      if (image_data === undefined) {
        reject(new Error('image_data undefined'))
        return
      }

      const result = await waifu2x.enlarge(image_data, updateProgress)
      resolve(await processResult(result, img.width * 2, img.height * 2))
    }
    img.src = canvas.toDataURL()
  })
}

export const upscale = (canvas: HTMLCanvasElement) : Promise<HTMLCanvasElement> => {
  upscaling.value = true

  if (!has_offscreen_canvas_support) {
    return upscalefallback(canvas)
  }

  return new Promise(resolve => {
    if (upscaleWorker === null) {
      upscaleWorker = new Worker()
    }
    upscaleWorker.onmessage = async (event: MessageEvent) => {
      if (event.data.type === 'progress') {
        updateProgress(event.data.value)
        return
      }
      const { result, width, height } = event.data
      resolve(await processResult(result, width, height))
    }

    const img = new Image()
    img.onload = async () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')
      ctx?.drawImage(img, 0, 0, img.width, img.height)
      upscaleWorker?.postMessage({
        image_data: ctx?.getImageData(0, 0, img.width, img.height),
        width: c.width,
        height: c.height
      })
    }
    img.src = canvas.toDataURL()
  })
}

export default {
  upscaling,
  upscale,
  progress
}
