<template>
  <img v-if="!clicked" @click="showCropper" :src="result.image_url" :title="result.title" class="image-result" />
  <VueCropper :class="{'hidden': !clicked}" @ready="ready" @cropend="cropend" ref="cropper"
    :title="result.title" :src="result.image_url"
    :rotatable="false" :scalable="false" :zoomable="false" :viewMode="1" :aspectRatio="1" :minCropBoxWidth="200" :minCropBoxHeight="200" :checkCrossOrigin="false"
  />
</template>

<script lang="ts">
import "cropperjs/dist/cropper.css"
import { ref, onUnmounted, defineComponent, PropType } from "vue"
import { useStore } from "../store"
import VueCropper, { VueCropperMethods } from "vue-cropperjs"
import { SearchResult } from "../types"
import { downscaleImage } from "../image"

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
    const cropper = ref<VueCropperMethods|null>(null)
    const store = useStore()
    const clicked = ref(false)

    onUnmounted(() => (cropper.value as VueCropperMethods)?.destroy())
    const ready = () => (cropper.value as VueCropperMethods)?.zoomTo(0.5)

    const cropend = () => {
      const { x, y, width, height } = (cropper.value as VueCropperMethods)?.getData()
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, x, y, width, height, 0, 0, width, height)
        const imageSize = 200
        const downscaled = await downscaleImage(canvas, imageSize)
        const downscale_canvas = document.createElement("canvas")
        downscale_canvas.getContext("bitmaprenderer")?.transferFromImageBitmap(downscaled)
        store.dispatch("updateCell", {
          image: downscale_canvas.toDataURL("image/png"),
          title: props.result.title,
          bitmap: await createImageBitmap(canvas, 0, 0, width, height)
        })
      }
      img.crossOrigin = "Anonymous"
      img.src = props.result.image_url
    }

    const showCropper = () => {
      clicked.value = true
      cropend()
      emit("selected", props.result)
    }

    return { cropper, ready, cropend, clicked, showCropper }
  }
})
</script>

<style scoped>
.hidden {
  visibility: hidden;
  width: 0;
}

.image-result {
  cursor: pointer;
}
</style>
