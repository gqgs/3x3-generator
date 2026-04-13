<template>
  <div id="search" class="w-full h-full max-w-4xl rounded-[2rem] border border-white/60 bg-white/90 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/80 backdrop-blur sm:p-6">
    <div class="flex flex-wrap gap-2">
      <a
        v-for="api in apiNames"
        :key="api"
        href="#"
        class="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition"
        :class="currentApi === api ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'"
        @click.prevent="changeApi(api)"
      >{{ api }}</a>
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <a
        v-for="tab in tabs"
        :key="tab.value"
        href="#"
        class="rounded-full px-4 py-2 text-sm font-medium transition"
        :class="currentTab === tab.value ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'"
        @click.prevent="changeTab(tab.value)"
      >{{ tab.label }}</a>
    </div>
    <div
      class="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-3 shadow-inner sm:p-4"
      @dragenter.prevent
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div class="flex gap-2">
        <input
          class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          :placeholder="'Search ' + currentTab"
          autocomplete="off"
          v-model="query"
          type="text"
          id="name"
          name="name"
        >
        <button
          type="button"
          class="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
          @click="openFilePicker"
        >
          <ion-icon name="images-outline"></ion-icon>
          <span class="hidden sm:inline">Upload</span>
        </button>
        <input
          ref="fileInput"
          class="hidden"
          type="file"
          accept="image/*"
          multiple
          @change="handleFileInput"
        >
      </div>
      <p class="mt-2 text-xs text-slate-500">Upload images or drag them here.</p>
    </div>
    <div v-if="loading" class="mt-4 overflow-hidden rounded-full bg-slate-200">
      <div class="h-2 w-full animate-pulse bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400"></div>
    </div>
    <div v-else-if="results.length" id="results" class="mt-5 flex gap-4 overflow-x-auto pb-2">
      <Cropper
        v-for="result in results"
        :key="result.mal_id"
        :result="result"
        :click-action="has_show_more && !showing_more ? 'show-more' : 'crop'"
        @show-more="showMore({ tab: currentTab, selected: result })"
      />
    </div>
    <div v-if="showing_more && selected_title" class="mt-4 flex justify-center">
      <p class="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
        {{ selected_title }}
      </p>
    </div>
    <div v-if="showing_more" class="mt-3 flex justify-center">
      <a
        href="#"
        class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click.prevent="goBack"
      >
        <ion-icon name="arrow-undo-outline"></ion-icon>
        <span>Back</span>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue"
import Cropper from "./ImgCropper.vue"
import Api from "../api"

export default defineComponent({
  components: {
    Cropper
  },
  setup () {
    const fileInput = ref<HTMLInputElement | null>(null)
    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }

    const tabs = computed(() => {
      return Api.tabs.value.map(tab => {
        return {
          value: tab,
          label: tab == "vn" ? "VN" : capitalize(tab)
        }
      })
    })
    const openFilePicker = () => {
      fileInput.value?.click()
    }

    return { ...Api, tabs, fileInput, openFilePicker }
  }
})
</script>

<style scoped>
#results {
  scrollbar-width: thin;
}
</style>
