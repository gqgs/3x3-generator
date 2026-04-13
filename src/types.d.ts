export interface Update {
  image: string;
  title: string;
  bitmap: ImageBitmap;
  sourceUrl?: string;
  sourceDataUrl?: string;
  cropData?: CropData;
  cropBoxData?: CropBoxData;
  canvasData?: CanvasData;
}

export interface SearchResult {
  guid?: string
  mal_id: number
  title: string
  image_url: string
  sourceUrl?: string
  sourceDataUrl?: string
  cropData?: CropData
  cropBoxData?: CropBoxData
  canvasData?: CanvasData
}

export interface CropData {
  x: number
  y: number
  width: number
  height: number
  rotate: number
  scaleX: number
  scaleY: number
}

export interface CropBoxData {
  left: number
  top: number
  width: number
  height: number
}

export interface CanvasData {
  left: number
  top: number
  width: number
  height: number
  naturalWidth?: number
  naturalHeight?: number
}

export interface GridImage {
  bitmap: ImageBitmap
  url: string
  title?: string
  sourceUrl?: string
  sourceDataUrl?: string
  cropData?: CropData
  cropBoxData?: CropBoxData
  canvasData?: CanvasData
}
