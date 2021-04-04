<template>
    <div id="search">
    <label for="name">Name:</label>
    <input @input="searchAnime($event.target.value)" type="text" id="name" name="name">
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import debounce from 'lodash.debounce'

export default defineComponent({
  methods: {
    searchAnime: debounce((anime: string) => {
      console.log('anime', anime)
    }, 500)
  }
})
</script>

<style scoped>
div#search {
    margin: 10px 0;
}
</style>
