<template>
  <div class="group relative h-full w-full">
    <a
      href="#"
      class="group flex h-full w-full items-center justify-center bg-slate-50/60 hover:bg-white"
      @click.prevent="showSearch"
      draggable="true"
      @dragstart="onDragStart"
      @dragover.prevent
      @drop="onDrop"
    >
      <template v-if="currentImage">
        <img :src="currentImage" :title="currentTitle" class="h-full w-full object-cover" />
        <span
          v-if="showCaption"
          class="pointer-events-none absolute inset-x-0 bottom-0 flex min-h-[22%] items-end bg-[linear-gradient(to_top,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.42)_62%,rgba(0,0,0,0)_100%)] px-[3.5%] pb-[2.5%] pt-[8%] text-left text-[clamp(0.68rem,2.8vw,0.9rem)] font-semibold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
        >
          <span class="line-clamp-2">{{ currentTitle }}</span>
        </span>
      </template>
      <span
        v-else
        class="icon-img flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_60%)] text-slate-400 transition group-hover:text-slate-600"
      >
        <ion-icon class="text-5xl" name="images-outline" />
      </span>
    </a>

    <button
      v-if="canRecrop"
      type="button"
      class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-slate-700 opacity-100 shadow-sm hover:text-blue-700 sm:opacity-0 sm:group-hover:opacity-100"
      aria-label="Adjust crop"
      @click.stop.prevent="openRecrop"
    >
      <ion-icon name="crop-outline"></ion-icon>
    </button>

    <CropperModal
      v-if="recropResult"
      :open="recropOpen"
      :result="recropResult"
      @applied="applyRecrop"
      @closed="recropOpen = false"
    />
  </div>
</template>

<style scoped>
.icon-img {
  min-height: 100%;
}
</style>

<script lang="ts">
import { ref, computed, defineComponent } from "vue"
import { useStore } from "../store"
import { SearchResult, Update } from "../types"
import CropperModal from "./CropperModal.vue"

export default defineComponent({
  components: {
    CropperModal
  },
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    const store = useStore()
    const title = ref("")
    const recropOpen = ref(false)

    const currentImageRecord = computed(() => store.state.images[props.id])

    const currentImage = computed(() => {
      return currentImageRecord.value ? currentImageRecord.value.url : ""
    })

    const currentTitle = computed(() => {
      return currentImageRecord.value?.title || title.value
    })

    const canRecrop = computed(() => {
      return Boolean(currentImageRecord.value?.sourceDataUrl)
    })

    const showCaption = computed(() => {
      return Boolean(store.state.includeTitles && currentImageRecord.value?.title)
    })

    const recropResult = computed<SearchResult | null>(() => {
      const image = currentImageRecord.value
      if (!image?.sourceDataUrl) return null
      return {
        mal_id: props.id,
        title: image.title || title.value || `Image ${props.id}`,
        image_url: image.sourceDataUrl,
        sourceUrl: image.sourceUrl,
        sourceDataUrl: image.sourceDataUrl,
        cropData: image.cropData,
        cropBoxData: image.cropBoxData,
        canvasData: image.canvasData
      }
    })

    const update = (update: Update) => {
      title.value = update.title
      store.dispatch("updateImages", {
        id: props.id,
        image: update.image,
        bitmap: update.bitmap,
        title: update.title,
        sourceUrl: update.sourceUrl,
        sourceDataUrl: update.sourceDataUrl,
        cropData: update.cropData,
        cropBoxData: update.cropBoxData,
        canvasData: update.canvasData
      })
    }

    const showSearch = () => store.dispatch("showSearch", { id: props.id, updater: update })

    const openRecrop = () => {
      if (canRecrop.value) recropOpen.value = true
    }

    const applyRecrop = (update: Update) => {
      store.dispatch("updateImages", {
        id: props.id,
        image: update.image,
        bitmap: update.bitmap,
        title: update.title,
        sourceUrl: update.sourceUrl,
        sourceDataUrl: update.sourceDataUrl,
        cropData: update.cropData,
        cropBoxData: update.cropBoxData,
        canvasData: update.canvasData
      })
      recropOpen.value = false
    }

    const onDragStart = (event: DragEvent) => {
      if (event.dataTransfer) {
        event.dataTransfer.setData("text/plain", props.id.toString())
      }
    }

    const onDrop = (event: DragEvent) => {
      if (event.dataTransfer) {
        const fromId = event.dataTransfer.getData("text/plain")
        store.commit("moveImage", { fromId, toId: props.id })
      }
    }

    return {
      currentImage,
      currentTitle,
      title,
      showSearch,
      onDragStart,
      onDrop,
      canRecrop,
      showCaption,
      recropOpen,
      recropResult,
      openRecrop,
      applyRecrop
    }
  }
})
</script>
