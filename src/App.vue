<template>
  <div id="background"></div>
  <transition name="fade">
  <div v-if="show_search"><Search /></div>
  </transition>
  <div @click="hideForm" id="grid">
  <Cell class="image" :class="{'selected': n === selected_id}" v-for="n in 9" :key="n" :id="n" />
  </div>
  <a href="https://github.com/gqgs/3x3-generator" target="_blank">
  <ion-icon id="github" name="logo-octocat"></ion-icon>
  </a>
  <Download />
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { mapState, mapActions } from "vuex"
import Cell from "./components/Cell.vue"
import Search from "./components/Search.vue"
import Download from "./components/Download.vue"

export default defineComponent({
  name: "App",
  components: {
    Cell,
    Search,
    Download
  },
  computed: {
    ...mapState([
      "show_search",
      "selected_id"
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

#grid {
  display: inline-grid;
  grid-template-columns: repeat(3, 200px);
  grid-template-rows: repeat(3, 200px);
  column-gap: 2px;
  row-gap: 2px;
  justify-content: center;
  width: 100%;
  padding: 10px;
}

.image {
  border: 1px solid black;
  line-height: 200px;
  overflow: hidden;
}

.selected {
  border: 5px dotted cadetblue;
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

#github {
  position: relative;
  left: -140px;
  top: 5px;
}
</style>
