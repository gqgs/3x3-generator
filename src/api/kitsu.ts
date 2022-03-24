import { SearchResult } from "../types"
import { API } from "./api"

interface APIResult {
  data: MediaData[] | CharacterData[]
}

interface MediaData {
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

interface CharacterData {
  id: number
  attributes: {
    names: {
      en: string
    }
    image?: {
      original: string
    }
  }
}

const params = (tab: string, query: string): string => {
  switch(tab) {
    case "characters":
      return `fields[${tab}]=names,image&filter[name]=${query}`
    default:
      return `fields[${tab}]=titles,posterImage&filter[text]=${query}`
  }
}

export default class Kitsu extends API<APIResult> {
  readonly name = "kitsu"
  readonly tabs = ["anime", "manga", "characters"]

  fetchURL(tab: string, query: string): { url: string } {
    return {
      url: `https://kitsu.io/api/edge/${tab}?${params(tab, encodeURI(query))}`
    }
  }
  processResult(result: APIResult): SearchResult[] {
    return (result.data ?? []).map((result: MediaData | CharacterData) => {
      return {
        mal_id: result.id,
        title: isMediaData(result) ? result.attributes.titles.en_jp : result.attributes.names.en,
        image_url: (isMediaData(result) ? (result.attributes.posterImage.original || result.attributes.posterImage.large) : result.attributes?.image?.original ?? "")
          .replace("https://", "https://cdn.statically.io/img/")
      }
    }).filter(result => result.image_url.length > 0)
  }
}

function isMediaData(data: MediaData | CharacterData): data is MediaData {
  return (data as MediaData).attributes.titles !== undefined
}