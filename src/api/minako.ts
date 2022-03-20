import { SearchResult } from "../types"

interface APIResult {
  id: number
  type: string
  title: string
  name: string // for characters
}

export const tabs = ["anime", "character"]
export const hasShowMore = false

let last_id = 0

export const search = async (query: string, tab: string): Promise<SearchResult[]> => {
  if (query.length < 3) {
    return []
  }
  const id = ++last_id
  const resp = await fetch(`https://api.minako.moe/${tab}/search/${encodeURI(query)}`)
  const data = await resp.json()
  if (last_id > id) return []
  return (data ?? []).map((result: APIResult) => {
    return {
      mal_id: result.id,
      title: result.title || result.name,
      image_url: `https://api.minako.moe/${tab}/${result.id}/image`
    }
  })
}

export default {
  tabs,
  search,
  hasShowMore,
}
