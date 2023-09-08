import { SearchResult } from "../types"
import { API } from "./api"
import { proxyImage } from "../proxy"

// https://anilist.github.io/ApiV2-GraphQL-Docs/

interface APIMediaResult {
  id: number
  coverImage: {
    extraLarge: string
  }
  title: {
    romaji: string
  }
}

interface APICharacterResult {
  id: number
  name: {
    full: string
  }
  image: {
    large: string
  }
}

interface APIResult {
  data: {
    Page: {
      media: APIMediaResult[]
      characters: APICharacterResult[]
    }
  }
}

export default class Anilist extends API<APIResult> {
  readonly name = "anilist"
  readonly tabs = ["anime", "manga", "character"]

  fetchURL(tab: string, query: string): { url: string, options: RequestInit } {
    const variables = {
      search: query,
      page: 1,
      type: tab.toUpperCase(),
      perPage: 15
    }
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        query: queries[tab],
        variables: variables
      })
    }
    return {
      url: "https://graphql.anilist.co",
      options
    }
  }
  processResult(result: APIResult, tab: string): SearchResult[] {
    if (tab === "character") return parseCharacters(result?.data?.Page?.characters)
    return parseMedia(result?.data?.Page?.media)
  }
}

const mediaQuery = `query ($id: Int, $page: Int, $perPage: Int, $search: String, $type: MediaType) {
    Page (page: $page, perPage: $perPage) {
      media (id: $id, search: $search, type: $type) {
        id
        type
        title {
          romaji
        }
        coverImage {
            extraLarge
        }
      }
    }
  }`

const characterQuery = `query ($id: Int, $page: Int, $perPage: Int, $search: String) {
    Page (page: $page, perPage: $perPage) {
      characters (id: $id, search: $search) {
        id
        name {
          full
        }
        image {
            large
        }
      }
    }
  }`

const queries: { [key: string]: string } = {
  anime: mediaQuery,
  manga: mediaQuery,
  character: characterQuery
}

const parseCharacters = (characters?: APICharacterResult[]): SearchResult[] => {
  if (!characters) return []
  return characters.map(result => {
    return {
      mal_id: result.id,
      title: result.name.full,
      image_url: proxyImage(result.image.large)
    }
  })
}

const parseMedia = (media?: APIMediaResult[]): SearchResult[] => {
  if (!media) return []
  return media.map(result => {
    return {
      mal_id: result.id,
      title: result.title.romaji,
      image_url: proxyImage(result.coverImage.extraLarge)
    }
  })
}