import { createStore, useStore as baseUseStore, Store } from "vuex"
import { Update } from "../types"
import { InjectionKey } from "vue"
import Color from "color"

export type ModelType = '6B' | 'Swin2SR';

export interface State {
  show_search: boolean
  selected_id: number
  updater: (update: Update) => void
  images: { 
    [key: string]: { 
      bitmap: ImageBitmap,
      url: string 
    } 
  }
  size: number
  cached_source: HTMLCanvasElement | null,
  color: string
  alpha: number
  draggedImage: { id: number, bitmap: ImageBitmap } | null
  downloading: boolean
  progress: number
  upscaleModel: ModelType
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
    color: localStorage.getItem("color") || "#ffffff",
    alpha: parseInt(localStorage.getItem("alpha") || "50"),
    draggedImage: null,
    downloading: false,
    progress: 0,
    upscaleModel: (() => {
      const stored = localStorage.getItem("upscaleModel");
      if (stored === 'Real-ESRGAN') return '6B';
      return (stored as ModelType) || 'Swin2SR';
    })()
  },
  mutations: {
    setUpscaleModel(state, model: ModelType) {
      state.upscaleModel = model;
      localStorage.setItem("upscaleModel", model);
      state.cached_source = null;
    },
    setDownloading (state, downloading) {
      state.downloading = downloading
    },
    setProgress (state, progress) {
      state.progress = progress
    },
    setDraggedImage(state, { id, bitmap }) {
      state.draggedImage = { id, bitmap };
    },
    clearDraggedImage(state) {
      state.draggedImage = null;
    },
    moveImage(state, { fromId, toId }) {
      if (state.images[fromId]) {
        const fromImage = state.images[fromId];
        const toImage = state.images[toId];
        if (toImage) {
          state.images[fromId] = toImage;
          state.images[toId] = fromImage;
        } else {
          state.images[toId] = fromImage;
          delete state.images[fromId];
        }
        state.cached_source = null;
      }
    },
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
      const images: { [key: string]: { bitmap: ImageBitmap, url: string } } = {}
      Object.keys(state.images).forEach(id => {
        if (parseInt(id) <= size * size) {
          images[id] = state.images[id]
        }
      })
      state.images = images
      state.size = size
    },
    updateImages(state, { id, bitmap, image }) {
      state.images[id] = {
        bitmap,
        url: image
      };
    },
    updateColor (state, color) {
      state.cached_source = null
      state.color = color
      localStorage.setItem("color", color)
    },
    updateAlpha (state, alpha) {
      state.cached_source = null
      state.alpha = alpha
      localStorage.setItem("alpha", alpha)
    },
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
    },
    updateAlpha (context, alpha) {
      context.commit("updateAlpha", alpha)
    }
  },
  getters: {
    tiles (state) {
      return state.size * state.size
    },
    complementary_color (state) {
      return new Color(state.color).mix(Color("darkblue")).hex()
    },
    color (state) {
      return new Color(state.color).alpha(state.alpha/100).hexa()
    }
  }
})
