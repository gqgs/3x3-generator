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

interface APICharacterResult {
  id: number
  name: string
  mug_shot?: {
    image_id: string
  }
}

type APIResult = APIGameResult[] | APICharacterResult[]

export default class IGDB extends API<APIResult> {
  readonly name = "IGDB"
  readonly tabs = ["game", "character"]
  private readonly proxyUrl = "https://pwh1z9812k.execute-api.us-west-2.amazonaws.com/prod"

  fetchURL(tab: string, query: string): { url: string, options: RequestInit } {
    const fields = tab === "character" ? "name, mug_shot.image_id" : "name, cover.image_id"
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "text/plain"
      },
      body: `search "${query}"; fields ${fields}; limit 40;`
    }
    return {
      url: `${this.proxyUrl}/${tab === "character" ? "characters" : "games"}`,
      options
    }
  }

  processResult(result: APIResult, tab: string): SearchResult[] {
    if (!Array.isArray(result)) return []
    if (tab === "character") return this.processCharacters(result as APICharacterResult[])
    return this.processGames(result as APIGameResult[])
  }

  private processGames(result: APIGameResult[]): SearchResult[] {
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

  private processCharacters(result: APICharacterResult[]): SearchResult[] {
    return result
      .filter(character => character.mug_shot?.image_id)
      .map(character => {
        const imageId = character.mug_shot!.image_id
        const imageUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`
        return {
          mal_id: character.id,
          title: character.name,
          image_url: imageUrl
        }
      })
  }
}
