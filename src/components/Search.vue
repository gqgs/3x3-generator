<template>
    <div class="field" id="search">
    <div class="tabs">
    <ul>
      <li v-for="tab in ['anime','manga','character']" :key=tab :class="{'is-active': currentTab === tab}">
        <a class="is-capitalized" href="#" @click.prevent="changeTab(tab)">{{tab}}</a>
      </li>
    </ul>
    </div>
    <div class="control">
      <input class="input" :placeholder="'Search ' + currentTab + '...'" autocomplete="off" @input="search($event.target.value)" type="text" id="name" name="name">
    </div>
    </div>
    <progress v-if="loading" class="progress is-small is-info" />
    <div id="results" v-else-if="results.length">
      <Cropper v-for="result in results" :key="result.mal_id" :result='result' />
    </div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'
import Cropper from './Cropper.vue'
import debounce from 'lodash.debounce'

/* eslint camelcase: ["error", {allow: ["image_url", "mal_id"]}] */

interface Result {
  mal_id: number
  title: string
  image_url: string
  name: string
}

export default defineComponent({
  components: {
    Cropper
  },
  setup () {
    const results = ref([])
    const loading = ref(false)
    const currentTab = ref('anime')

    let lastQuery = ''

    const search = debounce((query: string) => {
      lastQuery = query

      if (query.length < 3) {
        results.value = []
        return
      }
      loading.value = true

      fetch(`https://api.jikan.moe/v3/search/${currentTab.value}?&limit=15&q=${encodeURI(query)}`)
        .then(resp => resp.json())
        .then(data => {
          results.value = (data.results ?? []).map((result: Result) => {
            return { mal_id: result.mal_id, title: result.title || result.name, image_url: result.image_url }
          })
        })
        .finally(() => {
          loading.value = false
        })
    }, 500)

    const changeTab = (newtab: string) => {
      currentTab.value = newtab
      search(lastQuery)
    }

    return { results, loading, changeTab, currentTab, search }
  }
})
</script>

<style scoped>
div#search {
    width: 400px;
    margin: 10px auto;
}

div#results {
  height: 220px;
  overflow-x: auto;
  display: flex;
  max-width: 80%;
  margin: 10px auto;
}

img.result {
  padding: 1px;
  cursor: pointer;
  display: block;
  max-width: 100%;
}
</style>
