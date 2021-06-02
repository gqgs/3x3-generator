import { SearchResult } from "../types"

interface APIAnimeResult {
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

export const tabs = ["anime", "manga", "character"]
export const hasShowMore = false

let last_id = 0

const animeQuery = `query ($id: Int, $page: Int, $perPage: Int, $search: String, $type: MediaType) {
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
  anime: animeQuery,
  manga: animeQuery,
  character: characterQuery
}

const parseCharacters = (characters?: APICharacterResult[]): SearchResult[] => {
  if (!characters) return []
  return characters.map(character => {
    return {
      mal_id: character.id,
      title: character.name.full,
      image_url: character.image.large
        .replace("https://", "https://cdn.statically.io/img/")
    }
  })
}

const parseAnime = (anime?: APIAnimeResult[]): SearchResult[] => {
  if (!anime) return []
  return anime.map(result => {
    return {
      mal_id: result.id,
      title: result.title.romaji,
      image_url: result.coverImage.extraLarge
        .replace("https://", "https://cdn.statically.io/img/")
    }
  })
}

export const search = async (query: string, tab: string): Promise<SearchResult[]> => {
  if (query.length < 3) {
    return []
  }
  const variables = {
    search: encodeURI(query),
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
  const id = ++last_id
  const resp = await fetch("https://graphql.anilist.co", options)
  const data = await resp.json()
  if (last_id > id) return []
  if (tab === "character") return parseCharacters(data?.data?.Page?.characters)
  return parseAnime(data?.data?.Page?.media)
}
export default {
  search,
  hasShowMore,
  tabs
}
