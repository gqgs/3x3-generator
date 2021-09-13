import { SearchResult } from "../types"

interface Picture {
  large: string
  small: string
}

interface APIResult {
  mal_id: number
  title: string
  image_url: string
  name: string // for characters
}

export const tabs = ["anime", "manga", "character"]
export const hasShowMore = true

let last_id = 0

export const search = async (query: string, tab: string): Promise<SearchResult[]> => {
  if (query.length < 3) {
    return []
  }
  const id = ++last_id
  const resp = await fetch(`https://api.jikan.moe/v3/search/${tab}?&limit=15&q=${encodeURI(query)}`)
  const data = await resp.json()
  if (last_id > id) return []
  return (data.results ?? []).map((result: APIResult) => {
    return {
      mal_id: result.mal_id,
      title: result.title || result.name,
      image_url: result.image_url
    }
  })
}

export const showMore = async (tab: string, selected: SearchResult): Promise<SearchResult[]> => {
  const id = ++last_id
  const resp = await fetch(`https://api.jikan.moe/v3/${tab}/${selected.mal_id}/pictures`)
  const data = await resp.json()
  if (last_id > id) return []
  const image_set = new Set()
  const fetch_result: SearchResult[] = (data.pictures ?? []).map((picture: Picture) => {
    return {
      title: selected.title,
      image_url: picture.large
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
