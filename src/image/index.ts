import downscale from "downscale"

export const scaleImage = async (image: ImageBitmap, targetSize: number, denoiseModel: string): Promise<ImageBitmap> => {
  const min = Math.min(image.width, image.height)
  if (min > targetSize) {
    return downscaleImage(image, targetSize)
  }
  if (min < targetSize) {
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    canvas.getContext("2d")?.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)
    return upscaleImage(canvas, denoiseModel)
  }
  // min === targetSize
  return Promise.resolve(image)
}

export const downscaleImage = async (source: HTMLCanvasElement | ImageBitmap, targetSize: number): Promise<ImageBitmap> => {
  return new Promise(resolve => {
    const canvas = document.createElement("canvas")
    canvas.width = source.width
    canvas.height = source.height
    canvas.getContext("2d")?.drawImage(source, 0, 0, source.width, source.height, 0, 0, source.width, source.height)
    const img = new Image()
    img.onload = async () => {
      const downscaled = await downscale(img, targetSize, targetSize, { imageType: "png", returnCanvas: true })
      resolve(await createImageBitmap(downscaled, 0, 0, targetSize, targetSize))
    }
    img.src = canvas.toDataURL("image/png")
  })
}

const loadUpscaleWorker = (async () => {
  const Worker = (await (import("worker-loader!./upscale.worker"))).default
  return new Worker()
})()

const upscaleImage = async (canvas: HTMLCanvasElement, denoiseModel: string) : Promise<ImageBitmap> => {
  const [worker, bitmap] = await Promise.all([loadUpscaleWorker as Promise<Worker>, canvas.getContext("2d")?.getImageData(0, 0, 200, 200)])
  return new Promise(resolve => {
    worker.onmessage = (event: MessageEvent) => {
      const { upscaled } = event.data
      resolve(upscaled)
    }

    worker.postMessage({
      bitmap,
      denoiseModel
    })
  })
}

export default {
  downscaleImage,
  scaleImage
}
