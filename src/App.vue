<template>
  <Search v-if="show_search" />
  <div id="grid">
  <Image class="image" :class="[n == selected_id ? 'selected' : '']" v-for="n in 9" :key="n" :id="n" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'vuex'
import Image from './components/Image.vue'
import Search from './components/Search.vue'

export default defineComponent({
  name: 'App',
  components: {
    Image,
    Search
  },
  computed: {
    ...mapState([
      'show_search',
      'selected_id'
    ])
  }
})
</script>

<style>
#grid {
  display: inline-grid;
  grid-template-columns: repeat(3, 200px);
  grid-template-rows: repeat(3, 200px);
  column-gap: 5px;
  row-gap: 5px;
}

.image {
  border: 1px solid black;
  vertical-align: auto;
  line-height: 200px;
  overflow: hidden;
}

.selected {
  border: 6px solid darkcyan;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
