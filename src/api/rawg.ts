import { SearchResult } from "../types"
import { API } from "./api"
import { proxyImage } from "../proxy"

// https://api.rawg.io/docs/

interface APIResult {
  background_image: string
  name: string
}

interface APIResults {
  results: APIResult[]
}

export default class RAWG extends API<APIResults> {
  readonly name = "RAWG"
  readonly tabs = ["game"]

  fetchURL(tab: string, query: string): { url: string } {
    return {
        url: `https://api.rawg.io/api/games?key=d319323da8b7410d9ec813cbced4d01d&search=${encodeURI(query)}`
    }
  }
  processResult(result: APIResults, tab: string): SearchResult[] {
    return (result.results ?? []).map((result: APIResult) => {
      return {
        mal_id: Math.random(),
        title: result.name,
        image_url: proxyImage(result.background_image)
      }
    }).slice(0, 15)
  }
}
