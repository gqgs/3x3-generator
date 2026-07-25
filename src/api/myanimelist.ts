import { SearchResult } from "../types"
import { APIWithShowMore } from "./api"
import { proxyImage } from "@/proxy"

interface SearchData {
  id: number
  type: "anime" | "manga" | "character"
  name: string
  image_url: string
}

type APIResult = SearchData[]

interface APIShowMoreResult {
  character_id: number
  images: string[]
}

const defaultBaseURL = process.env.VUE_APP_MAL_API_URL || "http://127.0.0.1:8081"

export default class MyAnimeList extends APIWithShowMore<APIResult, APIShowMoreResult> {
  readonly name = "MAL"
  readonly tabs = ["anime", "manga", "character"]
  private readonly baseURL: string

  constructor(baseURL = defaultBaseURL) {
    super()
    this.baseURL = baseURL.replace(/\/+$/, "")
  }

  public supportsShowMore(tab: string): boolean {
    return tab === "character"
  }

  fetchURL(tab: string, query: string): { url: string } {
    return {
      url: `${this.baseURL}/search/${tab}?q=${encodeURIComponent(query)}`
    }
  }

  processResult(result: APIResult): SearchResult[] {
    return (result ?? []).map(item => {
      return {
        mal_id: item.id,
        title: item.name,
        image_url: proxyImage(item.image_url)
      }
    })
  }

  showMoreURL({ tab, selected }: { tab: string, selected: SearchResult }): { url: string } {
    if (tab !== "character") {
      throw new Error("Additional images are only available for characters")
    }
    return {
      url: `${this.baseURL}/character/${selected.mal_id}/images`
    }
  }

  processShowMoreResult({ result, selected }: {
    result: APIShowMoreResult
    selected: SearchResult
  }): SearchResult[] {
    return (result?.images ?? []).map((imageURL, index) => {
      return {
        mal_id: result.character_id * 1000 + index,
        title: selected.title,
        image_url: proxyImage(imageURL)
      }
    })
  }
}
