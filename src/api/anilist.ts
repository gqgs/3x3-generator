import { SearchResult } from "../types"

interface APIResult {
  id: number
  coverImage: {
    extraLarge: string
  }
  title: {
    romaji: string
  }
}

export const tabs = ["anime", "manga"]
export const hasShowMore = false

let last_id = 0

const apiQuery = `query ($id: Int, $page: Int, $perPage: Int, $search: String, $type: MediaType) {
    Page (page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
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
      query: apiQuery,
      variables: variables
    })
  }
  const id = ++last_id
  const resp = await fetch("https://graphql.anilist.co", options)
  const data = await resp.json()
  if (last_id > id) return []
  return (data?.data?.Page?.media ?? []).map((result: APIResult) => {
    return {
      mal_id: result.id,
      title: result.title.romaji,
      image_url: result.coverImage.extraLarge.replace("https://", "https://cdn.statically.io/img/")
    }
  })
}
export default {
  search,
  hasShowMore,
  tabs
}
