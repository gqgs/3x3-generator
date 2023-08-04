import { SearchResult } from "../types"
import { API } from "./api"
import { proxyImage } from "../proxy"

// https://www.giantbomb.com/api/documentation/

const api_key = "c2238d2e85d4c7b3f18aa58e114ce4e5c6ff808f"

interface APIResult {
  results: Result[]
}

interface Result {
  id: number
  name: string
  image: {
    original_url: string
  }
}

export default class GiantBomb extends API<APIResult> {
  readonly name = "giantbomb"
  readonly tabs = ["game", "character"]

  fetchURL(tab: string, query: string): { url: string } {
    return {
      url: proxyImage(`https://www.giantbomb.com/api/search/?api_key=${api_key}&resources=${tab}&query=${encodeURI(query)}&format=json`)
    }
  }
  processResult(result: APIResult): SearchResult[] {
    return (result?.results ?? []).map((result: Result) => {
      return {
        mal_id: result.id,
        title: result.name,
        image_url: proxyImage(result.image.original_url)
      }
    })
  }
}
