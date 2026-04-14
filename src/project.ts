import type { GridImage, CanvasData, CropBoxData, CropData } from "./types"
import type { ModelType, State } from "./store"
import { imageBitmapFromDataUrl, isImageDataUrl } from "./image/data-url"

export const PROJECT_APP_ID = "3x3-generator"
export const PROJECT_VERSION = 1

export interface ProjectSearchState {
  api: string
  tab: string
  query: string
}

export interface ProjectSettings {
  size: number
  cellSize: number
  color: string
  alpha: number
  upscaleModel: ModelType
  workerCount: number
  forceUpscale: boolean
  selectedId: number
}

export interface ProjectImage {
  title?: string
  croppedDataUrl: string
  sourceUrl?: string
  sourceDataUrl: string
  cropData?: CropData
  cropBoxData?: CropBoxData
  canvasData?: CanvasData
}

export interface ProjectFile {
  app: typeof PROJECT_APP_ID
  version: typeof PROJECT_VERSION
  exportedAt: string
  settings: ProjectSettings
  search: ProjectSearchState
  images: Record<string, ProjectImage>
}

export interface HydratedProject {
  settings: ProjectSettings
  search: ProjectSearchState
  images: Record<string, GridImage>
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const finiteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value)
}

const parseInteger = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value)
    return Number.isInteger(parsed) ? parsed : null
  }
  return null
}

const validModel = (value: unknown): value is ModelType => {
  return value === "6B" || value === "Swin2SR" || value === "HFA2kShallowESRGAN"
}

const validCropData = (value: unknown): value is CropData => {
  if (!isRecord(value)) return false
  return ["x", "y", "width", "height", "rotate", "scaleX", "scaleY"].every(key => finiteNumber(value[key]))
}

const validCropBoxData = (value: unknown): value is CropBoxData => {
  if (!isRecord(value)) return false
  return ["left", "top", "width", "height"].every(key => finiteNumber(value[key]))
}

const validCanvasData = (value: unknown): value is CanvasData => {
  if (!isRecord(value)) return false
  return ["left", "top", "width", "height"].every(key => finiteNumber(value[key]))
}

const assertProjectImage = (value: unknown): ProjectImage => {
  if (!isRecord(value)) {
    throw new Error("Project image entry is invalid")
  }
  if (!isImageDataUrl(value.croppedDataUrl)) {
    throw new Error("Project image is missing a valid cropped image")
  }
  if (!isImageDataUrl(value.sourceDataUrl)) {
    throw new Error("Project image is missing a valid source image")
  }

  return {
    title: typeof value.title === "string" ? value.title : undefined,
    croppedDataUrl: value.croppedDataUrl,
    sourceUrl: typeof value.sourceUrl === "string" ? value.sourceUrl : undefined,
    sourceDataUrl: value.sourceDataUrl,
    cropData: value.cropData === undefined ? undefined : validCropData(value.cropData) ? value.cropData : undefined,
    cropBoxData: value.cropBoxData === undefined ? undefined : validCropBoxData(value.cropBoxData) ? value.cropBoxData : undefined,
    canvasData: value.canvasData === undefined ? undefined : validCanvasData(value.canvasData) ? value.canvasData : undefined
  }
}

const assertProject = (value: unknown): ProjectFile => {
  if (!isRecord(value)) {
    throw new Error("Project file is not valid JSON")
  }
  if (value.app !== PROJECT_APP_ID || value.version !== PROJECT_VERSION) {
    throw new Error("Unsupported project file")
  }
  if (!isRecord(value.settings)) {
    throw new Error("Project settings are missing")
  }

  const settings = value.settings
  const size = parseInteger(settings.size)
  const cellSize = parseInteger(settings.cellSize)
  const color = settings.color
  const alpha = parseInteger(settings.alpha)
  const upscaleModel = settings.upscaleModel
  const workerCount = parseInteger(settings.workerCount)
  const forceUpscale = settings.forceUpscale

  if (size === null || size < 2 || size > 5) {
    throw new Error("Project grid size is invalid")
  }
  if (cellSize === null || cellSize < 100 || cellSize > 800) {
    throw new Error("Project output size is invalid")
  }
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error("Project border color is invalid")
  }
  if (alpha === null || alpha < 0 || alpha > 100) {
    throw new Error("Project border alpha is invalid")
  }
  if (!validModel(upscaleModel)) {
    throw new Error("Project upscale model is invalid")
  }
  if (workerCount === null || workerCount < 1 || workerCount > 9) {
    throw new Error("Project worker count is invalid")
  }
  if (typeof forceUpscale !== "boolean") {
    throw new Error("Project force-upscale setting is invalid")
  }

  const selectedId = parseInteger(settings.selectedId) ?? 0
  const search = isRecord(value.search) ? value.search : {}
  const imagesValue = isRecord(value.images) ? value.images : {}
  const images: Record<string, ProjectImage> = {}
  const maxId = size * size

  Object.entries(imagesValue).forEach(([id, image]) => {
    const numericId = parseInt(id)
    if (!Number.isInteger(numericId) || numericId < 1 || numericId > maxId || numericId.toString() !== id) {
      throw new Error("Project image id is invalid")
    }
    images[id] = assertProjectImage(image)
  })

  return {
    app: PROJECT_APP_ID,
    version: PROJECT_VERSION,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    settings: {
      size,
      cellSize,
      color,
      alpha,
      upscaleModel,
      workerCount,
      forceUpscale,
      selectedId: selectedId >= 1 && selectedId <= maxId ? selectedId : 0
    },
    search: {
      api: typeof search.api === "string" ? search.api : "Anilist",
      tab: typeof search.tab === "string" ? search.tab : "anime",
      query: typeof search.query === "string" ? search.query : ""
    },
    images
  }
}

export const createProject = (
  state: State,
  { cellSize, search }: { cellSize: number, search: ProjectSearchState }
): ProjectFile => {
  const images: Record<string, ProjectImage> = {}
  Object.entries(state.images).forEach(([id, image]) => {
    images[id] = {
      title: image.title,
      croppedDataUrl: image.url,
      sourceUrl: image.sourceUrl,
      sourceDataUrl: image.sourceDataUrl || image.url,
      cropData: image.cropData,
      cropBoxData: image.cropBoxData,
      canvasData: image.canvasData
    }
  })

  return {
    app: PROJECT_APP_ID,
    version: PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    settings: {
      size: state.size,
      cellSize,
      color: state.color,
      alpha: state.alpha,
      upscaleModel: state.upscaleModel,
      workerCount: state.workerCount,
      forceUpscale: state.forceUpscale,
      selectedId: state.selected_id
    },
    search,
    images
  }
}

export const parseProject = (text: string): ProjectFile => {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Project file could not be read as JSON")
  }
  return assertProject(data)
}

export const hydrateProject = async (project: ProjectFile): Promise<HydratedProject> => {
  const images: Record<string, GridImage> = {}
  for (const [id, image] of Object.entries(project.images)) {
    images[id] = {
      bitmap: await imageBitmapFromDataUrl(image.croppedDataUrl),
      url: image.croppedDataUrl,
      title: image.title,
      sourceUrl: image.sourceUrl,
      sourceDataUrl: image.sourceDataUrl,
      cropData: image.cropData,
      cropBoxData: image.cropBoxData,
      canvasData: image.canvasData
    }
  }

  return {
    settings: project.settings,
    search: project.search,
    images
  }
}
