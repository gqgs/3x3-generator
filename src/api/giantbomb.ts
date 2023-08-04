import { SearchResult } from "../types"
import { APIWithShowMore } from "./api"
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

interface APIShowMoreResult {
  results: Image[]
}

export default class GiantBomb extends APIWithShowMore<APIResult, APIShowMoreResult> {
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

  showMoreURL({ selected } : { selected: SearchResult } ) : { url: string } {
    return {
      url: proxyImage(`https://www.giantbomb.com/api/images/${selected.guid}/?api_key=${api_key}&format=json&limit=30`)
    }
  }

  processShowMoreResult({ result, selected } : { result: APIShowMoreResult, selected: SearchResult }) : SearchResult[] {
    return (result?.results ?? []).map((image: Image) => {
      return {
        mal_id: Math.random(),
        title: selected.title,
        image_url: proxyImage(image.original_url)
      }
    })
  }
}
