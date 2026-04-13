import { watch, ref } from "vue"
import { SearchResult } from "../types"
import debounce from "lodash.debounce"
import Kitsu from "./kitsu"
import Anilist from "./anilist"
import Jikan from "./jikan"
import LastFM from "./lastfm"
import VNDB from "./vndb"
import RAWG from "./rawg"
import { API, APIWithShowMore } from "./api"
import { fileToDataUrl } from "../image/data-url"

const apis = [new Kitsu(), new Jikan(), new Anilist(), new LastFM(), new RAWG(), new VNDB()]
const apisMap = new Map<string, API<unknown>>()

apis.forEach(api => {
  apisMap.set(api.name, api)
})

const apiFromString = (name: string): API<unknown> => {
  const api = apisMap.get(name)
  if (!api) {
    throw Error("api not found")
  }
  return api
}

const storage_api = localStorage.getItem("api") || "Anilist"
const api_exists = apis.some(api => {return api.name == storage_api })
const used_api = api_exists ? storage_api : apis[0].name

let api: API<unknown> = apiFromString(used_api)
let lastQuery = ""
let skipNextQuerySearch = false

const apiNames = apis.map(api => api.name)
const currentApi = ref(used_api)
const query = ref("")
const currentTab = ref(api.tabs[0])
const loading = ref(false)
const results = ref<SearchResult[]>([])
const tabs = ref(api.tabs)
const has_show_more = ref(api.has_show_more)
const showing_more = ref(false)
const selected_title = ref("")
const search = debounce(async (query: string, tab: string): Promise<void> => {
  loading.value = true
  showing_more.value = false
  selected_title.value = ""
  has_show_more.value = api.has_show_more
  results.value = await api.search(query, tab)
  loading.value = false
}, 500)

const changeTab = async (newtab: string): Promise<void> => {
  currentTab.value = newtab
  await search(lastQuery, newtab)
}

watch(currentApi, (api) => {
  localStorage.setItem("api", api)
})

watch(query, async (query) => {
  if (skipNextQuerySearch) {
    skipNextQuerySearch = false
    lastQuery = query
    return
  }
  lastQuery = query
  await search(query, currentTab.value)
})

const changeApi = async (newApi: string): Promise<void> => {
  currentApi.value = newApi
  api = apiFromString(newApi)
  tabs.value = api.tabs
  has_show_more.value = api.has_show_more
  selected_title.value = ""
  if (!api.tabs.includes(currentTab.value)) {
    currentTab.value = api.tabs[0]
  }
  await search(lastQuery, currentTab.value)
}

const showMore = async ({ tab, selected }: { tab: string, selected: SearchResult }): Promise<void> => {
  results.value = await (api as APIWithShowMore<unknown, unknown>).showMore({ tab, selected })
  showing_more.value = true
  selected_title.value = selected.title
}

const goBack = async (): Promise<void> => {
  await search(lastQuery, currentTab.value)
}

const handleFiles = async (files: FileList | File[] | null | undefined) => {
  if (!files) return
  search.cancel()
  const dropped: SearchResult[] = []
  for (let i = 0; i < files.length; i++) {
    const file = Array.isArray(files) ? files[i] : files.item(i)
    if (!file) continue
    const imageUrl = await fileToDataUrl(file)
    dropped.push({
      mal_id: Date.now() + i,
      title: file.name,
      image_url: imageUrl,
      sourceDataUrl: imageUrl,
    })
  }
  if (query.value !== "") {
    skipNextQuerySearch = true
    query.value = ""
  }
  lastQuery = ""
  results.value = dropped
  has_show_more.value = false
  showing_more.value = false
  selected_title.value = ""
}

const handleDrop = async (event: DragEvent) => {
  await handleFiles(event.dataTransfer?.files)
}

const handleFileInput = async (event: Event) => {
  const input = event.target as HTMLInputElement
  await handleFiles(input.files)
  input.value = ""
}

const getSearchState = () => {
  return {
    api: currentApi.value,
    tab: currentTab.value,
    query: query.value
  }
}

const restoreSearchState = ({ api: apiName, tab, query: restoredQuery }: { api: string, tab: string, query: string }) => {
  const nextApi = apisMap.has(apiName) ? apiName : apis[0].name
  currentApi.value = nextApi
  api = apiFromString(nextApi)
  tabs.value = api.tabs
  has_show_more.value = api.has_show_more
  currentTab.value = api.tabs.includes(tab) ? tab : api.tabs[0]
  search.cancel()
  const nextQuery = restoredQuery || ""
  if (query.value !== nextQuery) {
    skipNextQuerySearch = true
    query.value = nextQuery
  }
  lastQuery = query.value
  results.value = []
  showing_more.value = false
  selected_title.value = ""
  localStorage.setItem("api", currentApi.value)
}

export default {
  apis,
  apiNames,
  currentApi,
  changeApi,
  tabs,
  currentTab,
  changeTab,
  loading,
  query,
  results,
  has_show_more,
  showing_more,
  selected_title,
  showMore,
  goBack,
  handleDrop,
  handleFileInput,
  getSearchState,
  restoreSearchState
}
