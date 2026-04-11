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

  <!-- Download Progress Overlay -->
  <transition name="fade">
    <div
      v-if="downloading"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md"
    >
      <div class="w-full max-w-md px-8 text-center">
        <div class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-white shadow-2xl ring-1 ring-white/20">
          <ion-icon class="animate-pulse text-4xl" name="download-outline" />
        </div>
        <h2 class="mb-2 text-2xl font-bold text-white">Downloading...</h2>
        <p class="text-slate-300">Processing images.</p>
        <p class="mb-8 text-slate-300">This may take a minute.</p>
        
        <div class="relative h-4 overflow-hidden rounded-full bg-slate-800/50 p-1 shadow-inner ring-1 ring-white/10">
          <!-- Removed transition-all to ensure bar matches percentage exactly -->
          <div 
            class="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="mt-3 text-right font-mono text-sm font-medium text-sky-400">
          {{ Math.round(progress) }}%
        </div>
      </div>
    </div>
  </transition>

  <div class="flex min-h-screen flex-col">
    <main class="flex-1 px-4 pb-6 pt-6 sm:px-6 sm:pb-8 lg:px-8" @click="hideForm">
      <section class="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 md:gap-4">
        <div class="w-full rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/80 backdrop-blur">
          <div
            id="grid"
            class="mx-auto grid w-full max-w-2xl gap-0 overflow-hidden rounded-[1.5rem] bg-slate-200/70 shadow-inner"
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
        <div class="z-20 w-full rounded-[2.5rem] bg-gradient-to-t from-mist-100/95 via-mist-100/75 to-transparent pt-2 md:pt-3">
          <Tools />
        </div>
      </section>
    </main>
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
      "size",
      "downloading",
      "progress"
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
