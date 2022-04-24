<template>
    <div class="field" id="search">
    <div class="tabs is-small">
    <ul>
      <li v-for="api in apiNames" :key=api :class="{'is-active': currentApi === api}">
        <a class="is-capitalized" href="#" @click.prevent="changeApi(api)">{{api}}</a>
      </li>
    </ul>
    </div>
    <div class="tabs is-small">
    <ul>
      <li v-for="tab in tabs" :key=tab :class="{'is-active': currentTab === tab}">
        <a class="is-capitalized" href="#" @click.prevent="changeTab(tab)">{{tab}}</a>
      </li>
    </ul>
    </div>
    <div class="control">
      <input class="input" :placeholder="'Search ' + currentTab + ' or drag and drop images here'" autocomplete="off" v-model="query"
        type="text" id="name" name="name" @dragenter.prevent @dragover.prevent @drop.prevent="handleDrop">
    </div>
    </div>
    <progress v-if="loading" class="progress is-small is-info" />
    <div id="results" v-else-if="results.length">
      <Cropper @selected='selected = result' v-for="result in results" :key="result.mal_id" :result='result' />
    </div>
    <a v-show='showing_more' href="#" @click.prevent="goBack"><ion-icon size="large" name="arrow-undo-outline"></ion-icon></a>
    <span v-if='!has_show_more && selected'>{{selected.title}}</span>
    <a v-else-if='!showing_more && selected' href="#" @click.prevent="showMore(currentTab)">Show more of <b>{{selected.title}}</b></a>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import Cropper from "./ImgCropper.vue"
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

@media (max-width: 600px) {
  div#results {
    padding-bottom: 1.5rem
  }
}

img.result {
  padding: 1px;
  cursor: pointer;
  display: block;
  max-width: 100%;
}
</style>
