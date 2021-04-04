<template>
  <Search v-if="show_search" />
  <div id="grid">
  <Cell class="image" :class="[n == selected_id ? 'selected' : '']" v-for="n in 9" :key="n" :id="n" @newImage="newImage" />
  </div>
  <canvas id="output" ref="canvas" />
  <input class="button mb-4" type="button" value="Download image" @click="download" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'vuex'
import Cell from './components/Cell.vue'
import Search from './components/Search.vue'
import fileDownload from 'js-file-download'

export default defineComponent({
  name: 'App',
  components: {
    Cell,
    Search
  },
  mounted () {
    const canvas = (this.$refs.canvas as HTMLCanvasElement)
    canvas.width = 600
    canvas.height = 600
  },
  computed: {
    ...mapState([
      'show_search',
      'selected_id'
    ])
  },
  methods: {
    newImage (id: number, image: string) {
      const img = new Image()
      img.onload = () => {
        const canvas = (this.$refs.canvas as HTMLCanvasElement)
        const ctx = canvas.getContext('2d')
        // TODO: simplify this
        let [x, y] = [0, 0]
        if (id === 4 || id === 5 || id === 6) {
          y = 200
        } else if (id === 7 || id === 8 || id === 9) {
          y = 400
        }
        if (id === 2 || id === 5 || id === 8) {
          x = 200
        } else if (id === 3 || id === 6 || id === 9) {
          x = 400
        }
        /* eslint-disable-next-line no-unused-expressions */
        ctx?.drawImage(img, x, y)
      }
      img.src = image
    },
    download () {
      (this.$refs.canvas as HTMLCanvasElement).toBlob(blob => {
        if (blob == null) return
        fileDownload(blob, '3x3gen.jpg')
      })
    }
  }
})
</script>

<style>
html {
  background: rgb(0, 0, 0, 5%);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#output {
  display: none;
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
  vertical-align: auto;
  line-height: 200px;
  overflow: hidden;
}

.selected {
  border: 5px dotted cadetblue;
  border-radius: 5px;
}
</style>
