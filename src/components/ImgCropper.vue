<template>
  <img
    v-if="showImage"
    @click="openCropper"
    :src="thumbnailSrc"
    :title="result.title"
    class="image-result h-36 w-36 min-w-36 cursor-pointer rounded-2xl object-cover shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-blue-300 sm:h-40 sm:w-40 sm:min-w-40"
  />
  <img :src="thumbnailSrc" @load="onImageLoaded" style="display: none;">

  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
    @click.self="closeCropper"
  >
    <div class="flex min-h-full items-center justify-center">
      <div class="grid h-[calc(100vh-3rem)] w-full max-w-5xl gap-6 overflow-hidden rounded-[2rem] border border-white/15 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.35)] lg:grid-cols-[minmax(0,1.5fr)_320px] lg:p-6">
      <div class="min-h-[320px] overflow-hidden rounded-[1.5rem] bg-slate-100 h-full">
        <VueCropper
          ref="cropper"
          class="cropper-panel h-full w-full"
          :title="result.title"
          :src="resolvedCropperSrc"
          :rotatable="false"
          :scalable="false"
          :zoomable="false"
          :viewMode="1"
          :aspectRatio="1"
          :minCropBoxWidth="200"
          :minCropBoxHeight="200"
          :checkCrossOrigin="true"
          :preview="'.crop-preview'"
          @ready="ready"
        />
      </div>
      <div class="flex h-full flex-col gap-4 rounded-[1.5rem] bg-slate-50 p-4 overflow-y-auto">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Crop Selection</p>
          <h3 class="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">{{ result.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-600">Adjust the square crop, review the preview, then apply it to the selected grid cell.</p>
        </div>
        <div>
          <p class="mb-3 text-sm font-medium text-slate-700">Preview</p>
          <div class="crop-preview mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-inner"></div>
          <p v-if="errorMessage" class="mt-3 text-xs leading-5 text-rose-600">{{ errorMessage }}</p>
          <p v-else class="mt-3 text-xs leading-5 text-slate-500">This preview updates live as you move the crop box.</p>
        </div>
        <div v-if="sourceLoading" class="overflow-hidden rounded-full bg-slate-200">
          <div class="h-2 w-full animate-pulse bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400"></div>
        </div>
        <div v-if="processing" class="overflow-hidden rounded-full bg-slate-200">
          <div class="h-2 w-full animate-pulse bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400"></div>
        </div>
        <div class="mt-auto flex flex-col gap-3 sm:flex-row lg:flex-col">
          <button
            type="button"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100"
            @click="closeCropper"
          >
            Cancel
          </button>
          <button
            type="button"
            class="w-full rounded-2xl bg-slate-900 px-4 py-3 mb-20 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="processing || sourceLoading"
            @click="applyCrop"
          >
            {{ processing ? "Cropping..." : sourceLoading ? "Loading..." : "Crop Image" }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts">
import "cropperjs/dist/cropper.css"
import { ref, onUnmounted, defineComponent, PropType, computed } from "vue"
import { useStore } from "../store"
import VueCropper, { VueCropperMethods } from "vue-cropperjs"
import { SearchResult } from "../types"
import { downscaleImage } from "../image"
import { proxyImage } from "../proxy"

export default defineComponent({
  components: {
    VueCropper
  },
  props: {
    result: {
      required: true,
      type: Object as PropType<SearchResult>
    }
  },
  emits: ["selected"],
  setup (props, { emit }) {
    const cropper = ref<VueCropperMethods | null>(null)
    const store = useStore()
    const showImage = ref(false)
    const isOpen = ref(false)
    const processing = ref(false)
    const errorMessage = ref("")
    const sourceLoading = ref(false)
    const cropBlobUrl = ref("")

    const isLocalImage = (url: string): boolean => {
      return url.startsWith("blob:") || url.startsWith("data:")
    }

    const isAlreadyProxied = (url: string): boolean => {
      return url.includes("cloudfront.net")
    }

    const needsProxyNotice = computed(() => {
      return !isLocalImage(props.result.image_url) && !isAlreadyProxied(props.result.image_url)
    })

    const cropperSrc = computed(() => {
      return props.result.image_url
    })

    const thumbnailSrc = computed(() => cropperSrc.value)
    const resolvedCropperSrc = computed(() => cropBlobUrl.value || cropperSrc.value)

    const revokeBlobUrl = () => {
      if (cropBlobUrl.value && cropBlobUrl.value.startsWith("blob:")) {
        URL.revokeObjectURL(cropBlobUrl.value)
      }
      cropBlobUrl.value = ""
    }

    onUnmounted(() => {
      (cropper.value as VueCropperMethods | null)?.destroy()
      revokeBlobUrl()
    })

    const onImageLoaded = () => {
      showImage.value = true
    }

    const ready = () => {
      ;(cropper.value as VueCropperMethods | null)?.zoomTo(0.5)
      errorMessage.value = ""
    }

    const ensureLocalCropSource = async () => {
      if (isLocalImage(props.result.image_url)) {
        cropBlobUrl.value = props.result.image_url
        return
      }
      if (cropBlobUrl.value) return

      sourceLoading.value = true
      try {
        const response = await fetch(cropperSrc.value)
        if (!response.ok) {
          throw new Error(`failed to fetch image: ${response.status}`)
        }
        const blob = await response.blob()
        revokeBlobUrl()
        cropBlobUrl.value = URL.createObjectURL(blob)
      } finally {
        sourceLoading.value = false
      }
    }

    const openCropper = async () => {
      isOpen.value = true
      errorMessage.value = ""
      try {
        await ensureLocalCropSource()
      } catch {
        errorMessage.value = "The image could not be prepared for cropping. Try another result or upload the image directly."
      }
    }

    const closeCropper = () => {
      isOpen.value = false
      processing.value = false
      errorMessage.value = ""
      sourceLoading.value = false
    }

    const applyCrop = async () => {
      if (sourceLoading.value) return
      const cropCanvas = (cropper.value as VueCropperMethods | null)?.getCroppedCanvas()
      if (!cropCanvas) return

      processing.value = true
      errorMessage.value = ""

      try {
        const originalBitmap = await createImageBitmap(cropCanvas)
        const downscaled = await downscaleImage(originalBitmap, 200)
        const downscaleCanvas = document.createElement("canvas")
        downscaleCanvas.width = downscaled.width
        downscaleCanvas.height = downscaled.height
        downscaleCanvas.getContext("bitmaprenderer")?.transferFromImageBitmap(downscaled)

        store.dispatch("updateCell", {
          image: downscaleCanvas.toDataURL("image/png"),
          title: props.result.title,
          bitmap: originalBitmap
        })
        emit("selected", props.result)
        store.dispatch("hideSearch")
        closeCropper()
      } catch {
        processing.value = false
        errorMessage.value = "Cropping failed because this image host blocks canvas export. Try another result or upload the image directly."
      }
    }

    return {
      cropper,
      ready,
      showImage,
      onImageLoaded,
      isOpen,
      openCropper,
      closeCropper,
      applyCrop,
      processing,
      sourceLoading,
      errorMessage,
      cropperSrc,
      thumbnailSrc,
      resolvedCropperSrc
    }
  }
})
</script>

<style scoped>
:deep(.cropper-container) {
  height: 100% !important;
  width: 100% !important;
}

:deep(.cropper-canvas),
:deep(.cropper-wrap-box),
:deep(.cropper-drag-box),
:deep(.cropper-crop-box) {
  border-radius: 1rem;
}

.crop-preview :deep(img) {
  display: block;
  height: 100%;
  max-width: none;
}
</style>
