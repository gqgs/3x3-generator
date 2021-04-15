<template>
    <VueCropper @cropend="cropend" ref="cropper"
      :title="result.title" :src="result.image_url"
      rotatable=false scalable=false zoomable=false viewMode=1 aspectRatio=1 minCropBoxWidth=200 minCropBoxHeight=200
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
    cropend () {
      const image = (this.$refs.cropper as VueCropperMethods).getCroppedCanvas().toDataURL()
      this.updateCell({
        image,
        title: this.result.title
      })
    }
  }
})
</script>
