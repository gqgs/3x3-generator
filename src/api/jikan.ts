import { SearchResult } from "../types"

interface Image {
  jpg: {
    image_url: string
    large_image_url: string
  }
}

interface APIResult {
  mal_id: number
  title: string
  images: Image
  name: string // for characters
}

export const tabs = ["anime", "manga", "characters"]
export const hasShowMore = true

let last_id = 0

export const search = async (query: string, tab: string): Promise<SearchResult[]> => {
  if (query.length < 3) {
    return []
  }
  const id = ++last_id
  const resp = await fetch(`https://api.jikan.moe/v4/${tab}?limit=15&desc=desc&order_by=popularity&q=${encodeURI(query)}`)
  const data = await resp.json()
  if (last_id > id) return []
  return (data.data ?? []).map((result: APIResult) => {
    return {
      mal_id: result.mal_id,
      title: result.title || result.name,
      image_url: result.images.jpg.large_image_url || result.images.jpg.image_url
    }
  })
}

export const showMore = async (tab: string, selected: SearchResult): Promise<SearchResult[]> => {
  const id = ++last_id
  const resp = await fetch(`https://api.jikan.moe/v4/${tab}/${selected.mal_id}/pictures`)
  const data = await resp.json()
  if (last_id > id) return []
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

export default {
  tabs,
  search,
  hasShowMore,
  showMore
}
