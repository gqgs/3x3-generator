
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

const mergeEnlarged = (enlarged: UpscaleImage[], width: number, height: number) : HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  enlarged.forEach(({ image, x, y }: UpscaleImage) => {
    ctx?.putImageData(image, x, y)
  })
  upscaling.value = false
  progress.value = 0
  return canvas
}

const upscalefallback = (canvas: HTMLCanvasElement) : Promise<HTMLCanvasElement> => {
  return new Promise(async (resolve, reject) => {
    const ctx = canvas.getContext('2d')
    const image_data = ctx?.getImageData(0, 0, canvas.width, canvas.height)
    if (image_data === undefined) {
      reject(new Error('image_data undefined'))
      return
    }
    const result = await waifu2x.enlarge(image_data, updateProgress)
    resolve(mergeEnlarged(result, canvas.width * 2, canvas.height * 2))
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
    upscaleWorker.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'progress') {
        updateProgress(event.data.value)
        return
      }
      const { result, width, height } = event.data
      resolve(mergeEnlarged(result, width, height))
    }

    const ctx = canvas.getContext('2d')
    upscaleWorker.postMessage({
      image_data: ctx?.getImageData(0, 0, canvas.width, canvas.height),
      width: canvas.width,
      height: canvas.height
    })
  })
}

export default {
  upscaling,
  upscale,
  progress
}
