import { watch, ref } from "vue"
import { SearchResult } from "../types"
import debounce from "lodash.debounce"
import Kitsu from "./kitsu"
import Minako from "./minako"
import Anilist from "./anilist"
import Jikan from "./jikan"
import { API } from "./api"

const apis = [new Kitsu(), new Jikan(), new Anilist(), new Minako()]
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

const storage_api = localStorage.getItem("api") || "anilist"

let api: API<unknown> = apiFromString(storage_api)
let lastQuery = ""

const apiNames = apis.map(api => api.name)
const currentApi = ref(storage_api)
const query = ref("")
const currentTab = ref("anime")
const loading = ref(false)
const results = ref<SearchResult[]>([])
const tabs = ref(api.tabs)
const has_show_more = ref(api.has_show_more)
const showing_more = ref(false)
const selected = ref<SearchResult|null>(null)

const search = debounce(async (query: string, tab: string): Promise<void> => {
  loading.value = true
  showing_more.value = false
  selected.value = null
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
  lastQuery = query
  await search(query, currentTab.value)
})

const changeApi = async (newApi: string): Promise<void> => {
  selected.value = null
  currentApi.value = newApi
  api = apiFromString(newApi)
  tabs.value = api.tabs
  has_show_more.value = api.has_show_more
  if (api.tabs.includes(currentTab.value)) {
    await search(lastQuery, currentTab.value)
  } else {
    selected.value = null
    showing_more.value = false
    results.value = []
  }
}

const showMore = async (tab: string): Promise<void> => {
  if (selected.value == null) return
  results.value = await api.showMore(tab, selected.value)
  showing_more.value = true
}

const goBack = async (): Promise<void> => {
  await search(lastQuery, currentTab.value)
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
  selected,
  showMore,
  goBack
}