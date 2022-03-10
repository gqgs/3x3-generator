export interface Update {
  image: string;
  title: string;
  bitmap: ImageBitmap;
}

export interface SearchResult {
  mal_id: number
  title: string
  image_url: string
}

export abstract class UpscaleWorker {
  abstract predict (pixels: ImageData, denoiseModel: string): Promise<ImageBitmap>
}
