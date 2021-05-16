
import { watch, ref } from "vue"
import jikan from "./jikan"
import kitsu from "./kitsu"
import { SearchResult } from "../types"
import debounce from "lodash.debounce"

interface API {
  tabs: string[]
  search: (query: string, tab: string) => Promise<SearchResult[]>
  hasShowMore: boolean
}

const storage_api = localStorage.getItem("api") || "kitsu"

let api: API = storage_api === "kitsu" ? kitsu : jikan
let lastQuery = ""

const apis = ref(["kitsu", "jikan"])
const currentApi = ref(storage_api)
const query = ref("")
const currentTab = ref("anime")
const loading = ref(false)
const results = ref<SearchResult[]>([])
const tabs = ref(api.tabs)
const hasShowMore = ref(api.hasShowMore)
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
  api = newApi === "kitsu" ? kitsu : jikan
  tabs.value = api.tabs
  hasShowMore.value = api.hasShowMore
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
  results.value = await jikan.showMore(tab, selected.value)
  showing_more.value = true
}

const goBack = async (): Promise<void> => {
  await search(lastQuery, currentTab.value)
}

export default {
  apis,
  currentApi,
  changeApi,
  tabs,
  currentTab,
  changeTab,
  loading,
  query,
  results,
  hasShowMore,
  showing_more,
  selected,
  showMore,
  goBack
}
