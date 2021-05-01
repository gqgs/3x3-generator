import debounce from "lodash.debounce"
import { ref } from "vue"

interface Result {
  mal_id: number
  title: string
  image_url: string
  name: string
}

interface Picture {
  large: string
  small: string
}

export const results = ref<Result[]>([])
export const loading = ref(false)
export const selected = ref<Result|null>(null)
export const showing_more = ref(false)

let last_id = 0

export const search = debounce((query: string, tab: string) => {
  showing_more.value = false
  selected.value = null

  if (query.length < 3) {
    results.value = []
    return
  }
  const id = ++last_id
  loading.value = true
  fetch(`https://api.jikan.moe/v3/search/${tab}?&limit=15&q=${encodeURI(query)}`)
    .then(resp => resp.json())
    .then(data => {
      if (last_id > id) return
      results.value = (data.results ?? []).map((result: Result) => {
        return { mal_id: result.mal_id, title: result.title || result.name, image_url: result.image_url }
      })
    })
    .finally(() => {
      loading.value = false
    })
}, 500)

export const showMore = (tab: string): void => {
  showing_more.value = true
  loading.value = true
  const id = ++last_id
  fetch(`https://api.jikan.moe/v3/${tab}/${selected.value?.mal_id}/pictures`)
    .then(resp => resp.json())
    .then(data => {
      if (last_id > id) return
      const image_set = new Set()
      const fetch_result: Result[] = (data.pictures ?? []).map((picture: Picture) => {
        return { title: selected.value?.title, image_url: picture.large }
      }).filter((result: Result) => {
        const is_duplicated = image_set.has(result.image_url)
        image_set.add(result.image_url)
        return is_duplicated
      })
      results.value = fetch_result
    })
    .finally(() => {
      loading.value = false
    })
}

export const reset = (): void => {
  results.value = []
  selected.value = null
  showing_more.value = false
  loading.value = false
}

export default {
  results,
  loading,
  selected,
  showing_more,
  search,
  showMore,
  reset
}
