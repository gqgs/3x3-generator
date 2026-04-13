export const isImageDataUrl = (value: unknown): value is string => {
  return typeof value === "string" && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value)
}

export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Could not read blob as data URL"))
      }
    }
    reader.onerror = () => reject(reader.error || new Error("Could not read blob as data URL"))
    reader.readAsDataURL(blob)
  })
}

export const fileToDataUrl = (file: File): Promise<string> => {
  return blobToDataUrl(file)
}

export const dataUrlToBlob = (dataUrl: string): Blob => {
  if (!isImageDataUrl(dataUrl)) {
    throw new Error("Expected an image data URL")
  }

  const [header, data] = dataUrl.split(",", 2)
  const mimeMatch = /^data:([^;]+);base64$/.exec(header)
  if (!mimeMatch || !data) {
    throw new Error("Invalid image data URL")
  }

  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeMatch[1] })
}

export const imageBitmapFromDataUrl = async (dataUrl: string): Promise<ImageBitmap> => {
  return createImageBitmap(dataUrlToBlob(dataUrl))
}
