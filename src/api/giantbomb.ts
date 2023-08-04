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
  guid: string
  name: string
  image: Image
}

interface Image {
  original_url: string
}

export default class GiantBomb extends API<APIResult> {
  readonly has_show_more = true
  readonly name = "giantbomb"
  readonly tabs = ["game", "character"]

  fetchURL(tab: string, query: string): { url: string } {
    return {
      url: proxyImage(`https://www.giantbomb.com/api/search/?api_key=${api_key}&resources=${tab}&query=${encodeURI(query)}&format=json&field_list=id,name,image,guid`)
    }
  }
  processResult(result: APIResult): SearchResult[] {
    return (result?.results ?? []).map((result: Result) => {
      return {
        guid: result.guid,
        mal_id: result.id,
        title: result.name,
        image_url: proxyImage(result.image.original_url)
      }
    })
  }
  async showMore({ selected } : { selected: SearchResult}): Promise<SearchResult[]> {
    const id = ++this.last_id
    const resp = await fetch(proxyImage(`https://www.giantbomb.com/api/images/${selected.guid}/?api_key=${api_key}&format=json&limit=30`))
    const result = await resp.json()
    if (this.last_id > id) return []
    const image_set = new Set()
    const fetch_result: SearchResult[] = (result.results ?? []).map((image: Image) => {
      return {
        title: selected.title,
        image_url: proxyImage(image.original_url)
      }
    }).filter((result: SearchResult) => {
      const is_duplicated = image_set.has(result.image_url)
      image_set.add(result.image_url)
      return !is_duplicated
    })
    return fetch_result
  }
}
