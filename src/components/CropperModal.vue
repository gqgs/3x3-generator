<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="flex min-h-full items-center justify-center">
        <div class="grid h-[calc(100vh-3rem)] w-full max-w-5xl gap-6 overflow-hidden rounded-[2rem] border border-white/15 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.35)] lg:grid-cols-[minmax(0,1.5fr)_320px] lg:p-6">
          <div class="min-h-[320px] overflow-hidden rounded-[1.5rem] bg-slate-100 h-full">
            <div v-if="sourceLoading" class="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">
              Loading image...
            </div>
            <VueCropper
              v-else-if="resolvedCropperSrc"
              ref="cropper"
              class="cropper-panel h-full w-full"
              :title="result.title"
              :src="resolvedCropperSrc"
              :rotatable="false"
              :scalable="false"
              :zoomable="false"
              :viewMode="1"
              :aspectRatio="1"
              :autoCropArea="1"
              :minCropBoxWidth="200"
              :minCropBoxHeight="200"
              :checkCrossOrigin="true"
              :preview="'.crop-preview'"
              @ready="ready"
            />
          </div>
          <div class="flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-slate-50">
            <div class="flex-1 overflow-y-auto p-4">
              <div class="flex flex-col gap-4">
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
                <div v-if="processing" class="overflow-hidden rounded-full bg-slate-200">
                  <div class="h-2 w-full animate-pulse bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400"></div>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 p-4 pt-0">
              <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  @click="close"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  :disabled="processing || sourceLoading || !resolvedCropperSrc"
                  @click="applyCrop"
                >
                  {{ processing ? "Cropping..." : sourceLoading ? "Loading..." : "Crop Image" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import "cropperjs/dist/cropper.css"
import { computed, defineComponent, nextTick, onUnmounted, PropType, ref, watch } from "vue"
import VueCropper, { VueCropperMethods } from "vue-cropperjs"
import { SearchResult, Update } from "../types"
import { blobToDataUrl, isImageDataUrl } from "../image/data-url"

export default defineComponent({
  components: {
    VueCropper
  },
  props: {
    open: {
      type: Boolean,
      required: true
    },
    result: {
      required: true,
      type: Object as PropType<SearchResult>
    }
  },
  emits: ["applied", "closed"],
  setup (props, { emit }) {
    const cropper = ref<VueCropperMethods | null>(null)
    const processing = ref(false)
    const sourceLoading = ref(false)
    const errorMessage = ref("")
    const cropBlobUrl = ref("")
    const sourceDataUrl = ref("")

    const resolvedCropperSrc = computed(() => {
      return cropBlobUrl.value || sourceDataUrl.value || props.result.sourceDataUrl || props.result.image_url
    })

    const revokeBlobUrl = () => {
      if (cropBlobUrl.value && cropBlobUrl.value.startsWith("blob:")) {
        URL.revokeObjectURL(cropBlobUrl.value)
      }
      cropBlobUrl.value = ""
    }

    const resetSource = () => {
      revokeBlobUrl()
      sourceDataUrl.value = ""
      errorMessage.value = ""
      processing.value = false
    }

    onUnmounted(() => {
      cropper.value?.destroy()
      revokeBlobUrl()
    })

    const ensureLocalCropSource = async () => {
      resetSource()
      const preferredSource = props.result.sourceDataUrl || props.result.image_url
      if (isImageDataUrl(preferredSource)) {
        sourceDataUrl.value = preferredSource
        return
      }

      sourceLoading.value = true
      try {
        const response = await fetch(preferredSource)
        if (!response.ok) {
          throw new Error(`failed to fetch image: ${response.status}`)
        }
        const blob = await response.blob()
        sourceDataUrl.value = await blobToDataUrl(blob)
        cropBlobUrl.value = URL.createObjectURL(blob)
      } finally {
        sourceLoading.value = false
      }
    }

    watch(() => props.open, async (open) => {
      if (!open) return
      try {
        await ensureLocalCropSource()
      } catch {
        errorMessage.value = "The image could not be prepared for cropping. Try another result or upload the image directly."
      }
    }, { immediate: true })

    const restoreCropState = async () => {
      await nextTick()
      window.setTimeout(() => {
        try {
          if (props.result.canvasData) cropper.value?.setCanvasData(props.result.canvasData as any)
          if (props.result.cropBoxData) cropper.value?.setCropBoxData(props.result.cropBoxData as any)
          if (props.result.cropData) cropper.value?.setData(props.result.cropData as any)
        } catch (err) {
          console.warn("Could not restore crop state:", err)
        }
      }, 0)
    }

    const ready = () => {
      errorMessage.value = ""
      void restoreCropState()
    }

    const close = () => {
      resetSource()
      emit("closed")
    }

    const applyCrop = async () => {
      const cropperInstance = cropper.value
      if (sourceLoading.value || !cropperInstance) return
      const cropCanvas = cropperInstance.getCroppedCanvas()
      if (!cropCanvas) return

      processing.value = true
      errorMessage.value = ""

      try {
        const image = cropCanvas.toDataURL("image/png")
        const bitmap = await createImageBitmap(cropCanvas)
        const update: Update = {
          image,
          title: props.result.title,
          bitmap,
          sourceUrl: props.result.sourceUrl || props.result.image_url,
          sourceDataUrl: sourceDataUrl.value || props.result.sourceDataUrl || image,
          cropData: cropperInstance.getData(),
          cropBoxData: cropperInstance.getCropBoxData(),
          canvasData: cropperInstance.getCanvasData()
        }
        emit("applied", update)
      } catch {
        processing.value = false
        errorMessage.value = "Cropping failed because this image host blocks canvas export. Try another result or upload the image directly."
      }
    }

    return {
      cropper,
      processing,
      sourceLoading,
      errorMessage,
      resolvedCropperSrc,
      ready,
      close,
      applyCrop
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
