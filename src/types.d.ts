export interface Update {
  image: string;
  title: string;
  bitmap: ImageBitmap;
}

export interface SearchResult {
  guid?: string
  mal_id: number
  title: string
  image_url: string
}
