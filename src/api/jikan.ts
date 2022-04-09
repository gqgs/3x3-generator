import { SearchResult } from "../types"
import { API } from "./api"

// https://jikan.docs.apiary.io/

interface Image {
  jpg: {
    image_url: string
    large_image_url: string
  }
}

interface Data {
  mal_id: number
  title: string
  images: Image
  name: string // for characters
}

interface APIResult {
  data: Data[]
}

export default class Jikan extends API<APIResult> {
  readonly has_show_more = true
  readonly name = "jikan"
  readonly tabs = ["anime", "manga", "character"]

  fetchURL(tab: string, query: string): { url: string } {
    tab = this.denormalizeTab(tab)
    return {
      url: `https://api.jikan.moe/v4/${tab}?limit=15&desc=desc&order_by=popularity&q=${encodeURI(query)}`
    }
  }
  processResult(result: APIResult): SearchResult[] {
    return (result.data ?? []).map((result: Data) => {
      return {
        mal_id: result.mal_id,
        title: result.title || result.name,
        image_url: result.images.jpg.large_image_url || result.images.jpg.image_url
      }
    })
  }
  async showMore(tab: string, selected: SearchResult): Promise<SearchResult[]> {
    tab = this.denormalizeTab(tab)
    const id = ++this.last_id
    const resp = await fetch(`https://api.jikan.moe/v4/${tab}/${selected.mal_id}/pictures`)
    const data = await resp.json()
    if (this.last_id > id) return []
    const image_set = new Set()
    const fetch_result: SearchResult[] = (data.data ?? []).map((image: Image) => {
      return {
        title: selected.title,
        image_url: image.jpg.large_image_url || image.jpg.image_url
      }
    }).filter((result: SearchResult) => {
      const is_duplicated = image_set.has(result.image_url)
      image_set.add(result.image_url)
      return !is_duplicated
    })
    return fetch_result
  }
}
