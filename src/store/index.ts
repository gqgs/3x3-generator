import { createStore } from 'vuex'
import { Update } from '../types'

export default createStore({
  state: {
    show_search: false,
    selected_id: 0,
    updater: (update: Update) => { console.warn(`unexpected call: ${update}`) },
    canvas: document.createElement('canvas')
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
    updateCanvas (state, canvas) {
      state.canvas = canvas
    }
  },
  actions: {
    showSearch (context, { id, updater }) {
      context.commit('setShowSearch', true)
      context.commit('setSelectedID', id)
      context.commit('setUpdater', updater)
    },
    hideSearch (context) {
      context.commit('setShowSearch', false)
      context.commit('setSelectedID', 0)
    },
    updateCell (context, update) {
      context.commit('updateCell', update)
    },
    updateCanvas (context, { id, image }) {
      const img = new Image()
      img.onload = () => {
        const canvas = context.state.canvas
        const ctx = canvas.getContext('2d')
        const x = 200 * ((id + 2) % 3)
        const y = 200 * Math.floor(id * 0.3)
        ctx?.drawImage(img, x, y)
        context.commit('updateCanvas', canvas)
      }
      img.src = image
    }
  }
})
