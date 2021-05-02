<template>
  <img v-if="!clicked" @click="showCropper" :src="result.image_url" :title="result.title" class="image-result" />
  <VueCropper :class="{'hidden': !clicked}" @ready="ready" @cropend="cropend" ref="cropper"
    :title="result.title" :src="result.image_url"
    :rotatable="false" :scalable="false" :zoomable="false" :viewMode="1" :aspectRatio="1" :minCropBoxWidth="200" :minCropBoxHeight="200"
  />
</template>

<script lang="ts">
import "cropperjs/dist/cropper.css"
import { ref, onUnmounted, defineComponent, PropType } from "vue"
import { useStore } from "vuex"
import VueCropper, { VueCropperMethods } from "vue-cropperjs"
import { SearchResult } from "../api"

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
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 200
        canvas.height = 200
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, x, y, width, height, 0, 0, 200, 200)
        store.dispatch("updateCell", {
          image: canvas.toDataURL("image/png"),
          title: props.result.title
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
