import { createStore } from "vuex"
import { Update } from "../types"

export default createStore({
  state: {
    show_search: false,
    selected_id: 0,
    updater: (update: Update) => { console.warn(`unexpected call: ${update}`) },
    images: {},
    size: 3
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
      state.updater(update)
    },
    updateSize (state, size) {
      // remove outdated images
      const images: { [key: string]: ImageBitmap } = {}
      Object.keys(state.images).forEach(id => {
        if (parseInt(id) <= size * size) {
          images[id] = (state.images as { [key: string]: ImageBitmap })[id]
        }
      })
      state.images = images
      state.size = size
    },
    updateImages (state, { id, bitmap }) {
      (state.images as { [key: string]: ImageBitmap })[id] = bitmap
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
    }
  },
  getters: {
    tiles (state) {
      return state.size * state.size
    }
  }
})
