import smartcrop, { type Crop } from "smartcrop"

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not load image for smart crop"))
    image.src = src
  })
}

export const maximizeSquareCrop = (crop: Crop, imageWidth: number, imageHeight: number): Crop => {
  const size = Math.min(imageWidth, imageHeight)
  const centerX = crop.x + crop.width / 2
  const centerY = crop.y + crop.height / 2

  return {
    x: clamp(centerX - size / 2, 0, imageWidth - size),
    y: clamp(centerY - size / 2, 0, imageHeight - size),
    width: size,
    height: size,
  }
}

export const getInitialSquareCrop = async (src: string): Promise<Crop> => {
  const image = await loadImage(src)
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  const size = Math.min(width, height)

  if (width === height) {
    return {
      x: 0,
      y: 0,
      width,
      height,
    }
  }

  const result = await smartcrop.crop(image, {
    width: size,
    height: size,
    minScale: 1,
  })

  return maximizeSquareCrop(result.topCrop, width, height)
}
