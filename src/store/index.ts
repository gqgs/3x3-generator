import { createStore } from 'vuex'
import { Update } from '../types'

export default createStore({
  state: {
    show_search: false,
    selected_id: 0,
    updater: (update: Update) => { console.warn(`unexpected call: ${update}`) }
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
    }
  },
  modules: {
  }
})
