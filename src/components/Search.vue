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
      <input class="input" :placeholder="'Search ' + currentTab + '...'" autocomplete="off" v-model="query" type="text" id="name" name="name">
    </div>
    </div>
    <progress v-if="loading" class="progress is-small is-info" />
    <div id="results" v-else-if="results.length">
      <Cropper @selected='selected = result' v-for="result in results" :key="result.mal_id" :result='result' />
    </div>
    <a v-if='showing_more' href="#" @click.prevent="goBack"><ion-icon size="large" name="arrow-undo-outline"></ion-icon></a>
    <a v-else-if='selected && !showing_more' href="#" @click.prevent="showMore(currentTab)">Show more of <b>{{selected.title}}</b></a>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import Cropper from "./Cropper.vue"
import Api from "../api"

export default defineComponent({
  components: {
    Cropper
  },
  setup () {
    return { ...Api }
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
