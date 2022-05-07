<template>
  <div id="background"></div>
  <transition name="fade">
  <div v-if="show_search"><Search /></div>
  </transition>
  <div id="grid" class="container is-max-desktop py-5" @click="hideForm">
    <div id="columns" class="columns is-inline-flex is-multiline is-mobile">
    <Cell class="image column p-0" :class="{'selected': n === selected_id, 'is-half': tiles === 4, 'is-one-third': tiles === 9, 'is-one-quarter': tiles === 16, 'is-one-fifth': tiles === 25}"
      v-for="n in tiles" :key="n" :id="n" :style="{'box-shadow': '0px 0px 0px 1px ' + (n === selected_id ? complementary_color : color) }" />
    </div>
  </div>
  <Tools />
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { mapState, mapActions, mapGetters } from "vuex"
import Cell from "./components/GridCell.vue"
import Search from "./components/SearchItem.vue"
import Tools from "./components/ToolBar.vue"

export default defineComponent({
  name: "App",
  components: {
    Cell,
    Search,
    Tools
  },
  computed: {
    ...mapState([
      "show_search",
      "selected_id"
    ]),
    ...mapGetters([
      "tiles",
      "complementary_color",
      "color"
    ])
  },
  methods: {
    ...mapActions([
      "hideSearch"
    ]),
    hideForm (event: Event) {
      if ((event.target as Element).id === "grid") {
        this.hideSearch()
      }
    }
  }
})
</script>

<style>
html {
  background: rgb(0, 0, 0, 5%);
}

#background {
  background-image: url("./assets/nyanpasu.webp");
  width: 582px;
  height: 958px;
  position: fixed;
  bottom: 0;
  right: 0;
  opacity: 0.04;
  z-index: -1;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#columns {
  width: 100%;
  max-width: 600px;
}

.image {
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.selected {
  border-width: 5px;
  border-style: dotted;
  border-radius: 5px;
}

.fade-enter-active {
  transition: all .4s ease;
}

.fade-leave-active {
  transition: all .1s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
