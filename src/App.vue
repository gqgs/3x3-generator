<template>
  <div id="background"></div>
  <transition name="fade">
  <div v-if="show_search"><Search /></div>
  </transition>
  <div id="grid" class="container is-max-desktop py-5" @click="hideForm">
    <div id="columns" class="columns is-inline-flex is-multiline is-mobile">
    <Cell class="image column is-one-third p-0" :class="{'selected': n === selected_id}" v-for="n in 9" :key="n" :id="n" />
    </div>
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

#columns {
  width: 100%;
  max-width: 600px;
}

.image {
  border: 1px solid black;
  aspect-ratio: 1 / 1;
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
  left: -35px;
  top: 5px;
}
</style>
