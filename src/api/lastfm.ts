import { SearchResult } from "../types"
import { API } from "./api"

interface APIResult {
  results: {
    albummatches: {
      album: Album[]
    }
  }
}

interface Album {
  name: string
  artist: string
  image: Image[]
}

interface Image {
  "#text": string
  size: string
}

export default class LastFM extends API<APIResult> {
  readonly name = "Last.FM"
  readonly tabs = ["albums"]

  fetchURL(tab: string, query: string): { url: string } {
    return {
      url: `https://ws.audioscrobbler.com/2.0?method=album.search&album=${encodeURI(query)}&api_key=dc639df7a8d4027a6f8d66ba3f9eb0a2&format=json`,
    }
  }
  processResult(result: APIResult): SearchResult[] {
    return (result?.results?.albummatches.album ?? []).map((result: Album) => {
      return {
        mal_id: Math.random(),
        title: `${result.artist} - ${result.name}`,
        image_url: result.image
          .filter(image => image.size === "extralarge")
          .shift()?.["#text"]
          .replace("300x300", "400x400") ?? ""
      }
    }).slice(0, 15)
  }
}
