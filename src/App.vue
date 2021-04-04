<template>
  <div id="grid">
  <Image class="image" />
  <Image class="image" />
  <Image class="image" />
  <Image class="image" />
  <Image class="image" />
  <Image class="image" />
  <Image class="image" />
  <Image class="image" />
  <Image class="image" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Image from './components/Image.vue'

export default defineComponent({
  name: 'App',
  components: {
    Image
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
