<template>
    <div id="search">
    <label for="name">Name:</label>
    <input @input="searchAnime($event.target.value)" type="text" id="name" name="name" ref="search">
    </div>
    <div id="results" v-if="results.length">
      <img class="result" v-for="result in results" @click="addImage(result)" :title="result.title" :src="result.image_url" :key="result.mal_id" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import debounce from 'lodash.debounce'

/* eslint camelcase: ["error", {allow: ["image_url", "mal_id"]}] */

interface Result {
  mal_id: number
  title: string
  image_url: string
}

export default defineComponent({
  data () {
    return {
      results: []
    }
  },
  created () {
    this.searchAnime = debounce(this.searchAnime, 500)
  },
  methods: {
    ...mapActions([
      'setImage'
    ]),
    searchAnime: function (anime: string) {
      fetch(`https://api.jikan.moe/v3/search/anime?q=${encodeURI(anime)}`)
        .then(resp => resp.json())
        .then(data => {
          this.results = (data.results ?? []).slice(0, 10).map((result: Result) => {
            return { mal_id: result.mal_id, title: result.title, image_url: result.image_url }
          })
        })
    },
    addImage (result: Result) {
      this.setImage(result.image_url)
    },
    reset () {
      (this.$refs.search as HTMLInputElement).value = ''
      this.results = []
    }
  }
})
</script>

<style scoped>
div#search {
    margin: 10px 0;
}

div#results {
  height: 225px;
  overflow-x: auto;
  display: flex;
  max-width: 80%;
  margin: 10px auto;
}

.result {
  padding: 1px;
  cursor: pointer;
}
</style>
