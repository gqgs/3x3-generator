import { SearchResult } from "../types"
import { API } from "./api"

// https://cryental.dev/services/anime/api/

interface APIResult {
  id: number
  type: string
  title: string
  name: string // for characters
}

export default class Minako extends API<APIResult[]> {
  readonly name = "Minako"
  readonly tabs = ["anime", "character"]

  fetchURL(tab: string, query: string): { url: string } {
    return {
      url: `https://api.minako.moe/${tab}/search/${encodeURI(query)}`
    }
  }
  processResult(result: APIResult[], tab: string): SearchResult[] {
    return (result ?? []).map((result: APIResult) => {
      return {
        mal_id: result.id,
        title: result.title || result.name,
        image_url: `https://api.minako.moe/${tab}/${result.id}/image`
      }
    }).slice(0, 15)
  }
}
