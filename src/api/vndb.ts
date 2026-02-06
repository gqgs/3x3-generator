import { SearchResult } from "../types"
import { API } from "./api"
import { proxyImage } from "../proxy"

// https://api.vndb.org/kana

interface APIResults {
  results: APIResult[]
}

interface APIResult {
    image: {
        url: string
    },
    title: string,
    name: string, // for character
    id: string
}

export default class VNDB extends API<APIResults> {
  readonly name = "VNDB"
  readonly tabs = ["vn", "character"]

  fetchURL(tab: string, query: string): { url: string, options: RequestInit } {
    switch(tab) {
        case "vn":
            return this.fetchVN(query)
        case "character":
            return this.fetchCharacter(query)
        default:
            throw new Error(`invalid tab: ${tab}`)
    }
  }

  private fetchVN(query: string): { url: string, options: RequestInit } {
    const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          filters: ["search", "=", query],
          fields: "title,image.url",
          sort: "searchrank"
        })
      }
    return {
      url: `https://api.vndb.org/kana/vn`,
      options
    }
  }

  private fetchCharacter(query: string): { url: string, options: RequestInit } {
    const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          filters: ["search", "=", query],
          fields: "name,image.url",
          sort: "searchrank"
        })
      }
    return {
      url: `https://api.vndb.org/kana/character`,
      options
    }
  }

  processResult(result: APIResults, tab: string): SearchResult[] {
    return (result.results ?? []).map((result: APIResult) => {
      return {
        mal_id: Math.random(),
        title: result.title || result.name,
        image_url: proxyImage(result.image.url)
      }
    }).slice(0, 15)
  }
}
