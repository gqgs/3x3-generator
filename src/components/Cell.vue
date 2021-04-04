<template>
<a href="#" @click.prevent="showSearch({id: id, imageSetter: setImage})">
  <canvas v-if="image" ref="canvas" />
  <span class="is-size-1" v-else><ion-icon name="images-outline"></ion-icon></span>
</a>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import smartcrop from 'smartcrop'

export default defineComponent({
  data () {
    return {
      image: ''
    }
  },
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  methods: {
    ...mapActions([
      'showSearch'
    ]),
    setImage (image: string) {
      const img = new Image()
      img.onload = () => {
        nextTick().then(async () => {
          const res = await smartcrop.crop(img, { height: 200, width: 200 })
          const canvas = (this.$refs.canvas as HTMLCanvasElement)
          canvas.width = 200
          canvas.height = 200
          const ctx = canvas.getContext('2d')
          const { x, y, width, height } = res.topCrop
          /* eslint-disable-next-line no-unused-expressions */
          ctx?.drawImage(img, x, y, width, height, 0, 0, 200, 200)

          this.$emit('newImage', this.id, canvas.toDataURL())
        })
      }
      img.crossOrigin = 'Anonymous'
      img.src = image
      this.image = image
    }
  }
})
</script>
