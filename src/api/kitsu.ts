import { SearchResult } from "../types"
import { API } from "./api"

interface APIResult {
  data: Data[]
}

interface Data {
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

export default class Kitsu extends API<APIResult> {
  readonly name = "kitsu"
  readonly tabs = ["anime", "manga"]

  fetchURL(tab: string, query: string): { url: string } {
    return {
      url: `https://kitsu.io/api/edge/${tab}?&fields[${tab}]=id,titles,posterImage&filter[text]=${encodeURI(query)}`
    }
  }
  processResult(result: APIResult): SearchResult[] {
    return (result.data ?? []).map((result: Data) => {
      return {
        mal_id: result.id,
        title: result.attributes.titles.en_jp,
        image_url: (result.attributes.posterImage.original || result.attributes.posterImage.large).replace("https://", "https://cdn.statically.io/img/")
      }
    })
  }
}