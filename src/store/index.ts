import { createStore } from 'vuex'

export default createStore({
  state: {
    show_search: false,
    selected_id: 0,
    image_setter: (image: string) => { console.warn(`unexpected call: ${image}`) }
  },
  mutations: {
    setSearch (state, show) {
      state.show_search = show
    },
    setSelectedID (state, id) {
      state.selected_id = id
    },
    setImageSetter (state, imageSetter) {
      state.image_setter = imageSetter
    },
    setImage (state, image) {
      state.image_setter(image)
    }
  },
  actions: {
    showSearch (context, { id, imageSetter }) {
      context.commit('setSearch', true)
      context.commit('setSelectedID', id)
      context.commit('setImageSetter', imageSetter)
    },
    hideSearch (context) {
      context.commit('setSearch', false)
      context.commit('setSelectedID', null)
    },
    setImage (context, image) {
      context.commit('setImage', image)
    }
  },
  modules: {
  }
})
