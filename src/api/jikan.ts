import { SearchResult } from "../types"
import { APIWithShowMore } from "./api"

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

interface APIShowMoreResult {
  data: Image[]
}

export default class Jikan extends APIWithShowMore<APIResult, APIShowMoreResult> {
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
  showMoreURL({ tab, selected } : { tab: string, selected: SearchResult }): { url: string } {
    tab = this.denormalizeTab(tab)
    return {
      url: `https://api.jikan.moe/v4/${tab}/${selected.mal_id}/pictures`
    }
  }

  processShowMoreResult({ result, selected } : { result: APIShowMoreResult, selected: SearchResult }) : SearchResult[] {
    return (result?.data ?? []).map((image: Image) => {
      return {
        mal_id: Math.random(),
        title: selected.title,
        image_url: image.jpg.large_image_url || image.jpg.image_url
      }
    })
  }
}
