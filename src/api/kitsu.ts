import { SearchResult } from "../types"

interface APIResult {
  id: number
  attributes: {
    titles: {
      en_jp: string
    }
    posterImage: {
      medium: string
      large: string
      original: string
    }
  }
}

export const tabs = ["anime", "manga"]
export const hasShowMore = false

let last_id = 0

export const search = async (query: string, tab: string): Promise<SearchResult[]> => {
  if (query.length < 3) {
    return []
  }
  const id = ++last_id
  const resp = await fetch(`https://kitsu.io/api/edge/${tab}?&fields[${tab}]=id,titles,posterImage&filter[text]=${encodeURI(query)}`)
  const data = await resp.json()
  if (last_id > id) return []
  return (data.data ?? []).map((result: APIResult) => {
    return {
      mal_id: result.id,
      title: result.attributes.titles.en_jp,
      image_url: result.attributes.posterImage.medium.replace("https://", "https://cdn.statically.io/img/")
    }
  })
}

export default {
  tabs,
  search,
  hasShowMore
}
