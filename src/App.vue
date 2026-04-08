<template>
  <transition name="fade">
    <div
      v-if="show_search"
      class="fixed inset-0 z-30 flex items-start justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm sm:py-10"
      @click.self="hideSearch"
    >
      <Search />
    </div>
  </transition>
  <div class="flex min-h-screen flex-col">
    <main class="flex-1 px-4 pb-6 pt-6 sm:px-6 lg:px-8" @click="hideForm">
      <section class="mx-auto flex max-w-6xl flex-col items-center">
      <div class="w-full max-w-4xl rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/80 backdrop-blur">
        <div
          id="grid"
          class="mx-auto grid w-full max-w-3xl gap-0 overflow-hidden rounded-[1.5rem] bg-slate-200/70 shadow-inner"
          :style="gridStyle"
        >
          <Cell
            v-for="n in tiles"
            :id="n"
            :key="n"
            class="image"
            :class="{ selected: n === selected_id }"
            :style="{ boxShadow: '0px 0px 0px 1px ' + (n === selected_id ? complementary_color : color) }"
          />
        </div>
      </div>
      </section>
    </main>
    <div class="sticky bottom-0 z-20 px-3 pb-3 pt-6 sm:px-6 sm:pb-6">
      <div class="mx-auto max-w-6xl rounded-[2.5rem] bg-gradient-to-t from-mist-100/95 via-mist-100/75 to-transparent px-0 pt-6">
        <Tools />
      </div>
    </div>
  </div>
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
      "selected_id",
      "size"
    ]),
    ...mapGetters([
      "tiles",
      "complementary_color",
      "color"
    ]),
    gridStyle () {
      return {
        gridTemplateColumns: `repeat(${this.size}, minmax(0, 1fr))`
      }
    }
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
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.image {
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.selected {
  border-radius: 1rem;
  outline: 4px dotted rgb(37 99 235 / 0.85);
  outline-offset: -4px;
}

.fade-enter-active {
  transition: all .25s ease;
}

.fade-leave-active {
  transition: all .12s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
