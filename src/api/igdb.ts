import { SearchResult } from "../types"
import { API } from "./api"

// https://api-docs.igdb.com/

interface APIGameResult {
  id: number
  name: string
  cover?: {
    image_id: string
  }
}

export default class IGDB extends API<APIGameResult[]> {
  readonly name = "IGDB"
  readonly tabs = ["game"]
  private readonly proxyUrl = "https://5l145ak96e.execute-api.sa-east-1.amazonaws.com/prod/games"

  fetchURL(tab: string, query: string): { url: string, options: RequestInit } {
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "text/plain"
      },
      body: `search "${query}"; fields name, cover.image_id; limit 40;`
    }
    return {
      url: this.proxyUrl,
      options
    }
  }

  processResult(result: APIGameResult[]): SearchResult[] {
    if (!Array.isArray(result)) return []
    return result
      .filter(game => game.cover?.image_id)
      .map(game => {
        const imageId = game.cover!.image_id
        const imageUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`
        return {
          mal_id: game.id,
          title: game.name,
          image_url: imageUrl
        }
      })
  }
}
