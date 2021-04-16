<template>
    <VueCropper @cropend="cropend" @ready="ready" ref="cropper"
      :title="result.title" :src="result.image_url"
      rotatable=false scalable=false zoomable=false viewMode=2 aspectRatio=1 minCropBoxWidth=200 minCropBoxHeight=200
    />
</template>

<script lang="ts">
import 'cropperjs/dist/cropper.css'
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import VueCropper, { VueCropperMethods } from 'vue-cropperjs'

export default defineComponent({
  components: {
    VueCropper
  },
  props: {
    result: {
      required: true,
      type: Object
    }
  },
  methods: {
    ...mapActions([
      'updateCell'
    ]),
    ready () {
      /* eslint-disable-next-line no-unused-expressions */
      (this.$refs.cropper as VueCropperMethods)?.zoomTo(0.5)
    },
    cropend () {
      const { x, y, width, height } = (this.$refs.cropper as VueCropperMethods).getData()
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 200
        const ctx = canvas.getContext('2d')
        /* eslint-disable-next-line no-unused-expressions */
        ctx?.drawImage(img, x, y, width, height, 0, 0, 200, 200)
        this.updateCell({
          image: canvas.toDataURL('image/png'),
          title: this.result.title
        })
      }
      img.crossOrigin = 'Anonymous'
      img.src = this.result.image_url
    }
  },
  unmounted () {
    /* eslint-disable-next-line no-unused-expressions */
    (this.$refs.cropper as VueCropperMethods)?.destroy()
  }
})
</script>
