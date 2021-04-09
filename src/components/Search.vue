<template>
    <div class="field" id="search">
    <div class="tabs">
    <ul>
      <li :class="{'is-active': tab === 'anime'}"><a href="#" @click.prevent="updateTab('anime')">Anime</a></li>
      <li :class="{'is-active': tab === 'manga'}"><a href="#" @click.prevent="updateTab('manga')">Manga</a></li>
      <li :class="{'is-active': tab === 'character'}"><a href="#" @click.prevent="updateTab('character')">Character</a></li>
    </ul>
    </div>
    <div class="control">
      <input class="input" :placeholder="'Search ' + tab + '...'" autocomplete="off" @input="search($event.target.value)" type="text" id="name" name="name" ref="search">
    </div>
    </div>
    <progress v-if="loading" class="progress is-small is-info" />
    <div id="results" v-else-if="results.length">
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
  name: string
}

export default defineComponent({
  data () {
    return {
      results: [],
      loading: false,
      tab: 'anime',
      lastSearch: ''
    }
  },
  created () {
    this.search = debounce(this.search, 500)
  },
  methods: {
    ...mapActions([
      'updateCell'
    ]),
    updateTab (tab: string) {
      this.tab = tab
      this.search(this.lastSearch)
    },
    search (query: string) {
      this.lastSearch = query

      if (query.length < 3) {
        this.results = []
        return
      }
      this.loading = true

      fetch(`https://api.jikan.moe/v3/search/${this.tab}?&limit=15&q=${encodeURI(query)}`)
        .then(resp => resp.json())
        .then(data => {
          this.results = (data.results ?? []).map((result: Result) => {
            return { mal_id: result.mal_id, title: result.title || result.name, image_url: result.image_url }
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    addImage (result: Result) {
      this.updateCell({
        image: result.image_url,
        title: result.title
      })
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
