import { SearchResult } from "../types"
import { API } from "./api"
import { proxyImage } from "../proxy"

// https://kitsu.docs.apiary.io/

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
  readonly tabs = ["anime", "manga", "character"]

  fetchURL(tab: string, query: string): { url: string } {
    tab = this.denormalizeTab(tab)
    return {
      url: `https://kitsu.io/api/edge/${tab}?${params(tab, encodeURI(query))}`
    }
  }
  processResult(result: APIResult): SearchResult[] {
    return (result.data ?? []).map((result: MediaData | CharacterData) => {
      return {
        mal_id: result.id,
        title: isMediaData(result) ? result.attributes.titles.en_jp : result.attributes.names.en,
        image_url: proxyImage((isMediaData(result) ? (result.attributes.posterImage.original || result.attributes.posterImage.large) : result.attributes?.image?.original ?? ""))
      }
    }).filter(result => result.image_url.length > 0)
  }
}

const isMediaData = (data: MediaData | CharacterData): data is MediaData => {
  return (data as MediaData).attributes.titles !== undefined
}