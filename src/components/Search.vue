<template>
    <div class="field" id="search">
    <div class="control">
      <input class="input" autocomplete="off" @input="searchAnime($event.target.value)" type="text" id="name" name="name" ref="search">
    </div>
    </div>
    <div id="results" v-if="results.length">
      <img class="result" v-for="result in results" @click="addImage(result)" :title="result.title" :src="result.image_url" :key="result.mal_id" />
    </div>
    <progress v-else-if="loading" class="progress is-small is-info" />
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
      results: [],
      loading: false
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
      if (anime.length < 3) {
        this.results = []
        return
      }
      this.loading = true

      fetch(`https://api.jikan.moe/v3/search/anime?limit=10&q=${encodeURI(anime)}`)
        .then(resp => resp.json())
        .then(data => {
          this.results = (data.results ?? []).map((result: Result) => {
            return { mal_id: result.mal_id, title: result.title, image_url: result.image_url }
          })
          this.loading = false
        })
    },
    addImage (result: Result) {
      this.setImage(result.image_url)
    }
  }
})
</script>

<style scoped>
div#search {
    width: 400px;
    margin: 10px auto;
}

div#results {
  height: 225px;
  overflow-x: auto;
  display: flex;
  max-width: 80%;
  margin: 10px auto;
}

img.result {
  padding: 1px;
  cursor: pointer;
}
</style>
