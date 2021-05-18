import { createStore, useStore as baseUseStore, Store } from "vuex"
import { Update } from "../types"
import { InjectionKey } from "vue"

export interface State {
  show_search: boolean
  selected_id: number
  updater: (update: Update) => void
  images: { [key: string]: ImageBitmap }
  size: number
  cached_source: HTMLCanvasElement | null,
  color: string
}

export const key: InjectionKey<Store<State>> = Symbol("store")

export const useStore = (): Store<State> => {
  return baseUseStore(key)
}

export default createStore<State>({
  state: {
    show_search: false,
    selected_id: 0,
    updater: (update: Update) => { console.warn(`unexpected call: ${update}`) },
    images: {},
    size: 3,
    cached_source: null,
    color: localStorage.getItem("color") || "#ffffff"
  },
  mutations: {
    setShowSearch (state, showSearch) {
      state.show_search = showSearch
    },
    setSelectedID (state, id) {
      state.selected_id = id
    },
    setUpdater (state, updater) {
      state.updater = updater
    },
    updateCell (state, update) {
      state.cached_source = null
      state.updater(update)
    },
    updateSize (state, size) {
      state.cached_source = null
      // remove outdated images
      const images: { [key: string]: ImageBitmap } = {}
      Object.keys(state.images).forEach(id => {
        if (parseInt(id) <= size * size) {
          images[id] = state.images[id]
        }
      })
      state.images = images
      state.size = size
    },
    updateImages (state, { id, bitmap }) {
      state.images[id] = bitmap
    },
    updateColor (state, color) {
      state.cached_source = null
      state.color = color
      localStorage.setItem("color", color)
    }
  },
  actions: {
    showSearch (context, { id, updater }) {
      context.commit("setShowSearch", true)
      context.commit("setSelectedID", id)
      context.commit("setUpdater", updater)
    },
    hideSearch (context) {
      context.commit("setShowSearch", false)
      context.commit("setSelectedID", 0)
    },
    updateCell (context, update) {
      context.commit("updateCell", update)
    },
    updateImages (context, update) {
      context.commit("updateImages", update)
    },
    updateSize (context, size) {
      context.commit("updateSize", size)
    },
    updateColor (context, color) {
      context.commit("updateColor", color)
    }
  },
  getters: {
    tiles (state) {
      return state.size * state.size
    }
  }
})
