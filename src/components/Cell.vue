<template>
<a href="#" @click.prevent="showSearch({id: id, updater: update})">
  <canvas v-if="image" ref="canvas" :title="title" />
  <ion-icon v-else class="is-size-1" name="images-outline" />
</a>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import smartcrop from 'smartcrop'
import { Update } from '../types'
import 'tracking'
import 'tracking/build/data/eye'

export default defineComponent({
  data () {
    return {
      image: '',
      title: ''
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
      'showSearch',
      'updateCanvas'
    ]),
    update ({ image, title }: Update) {
      this.title = title
      this.setImage(image)
    },
    setImage (image: string) {
      const img = new Image()
      img.onload = () => {
        nextTick().then(() => {
          const tracker = new window.tracking.ObjectTracker(['eye'])
          window.tracking.track(img, tracker)
          tracker.on('track', async event => {
            const boost = event.data.map(aoi => { return { ...aoi, weight: 1 } })
            const res = await smartcrop.crop(img, { height: 200, width: 200, boost: boost })
            const canvas = (this.$refs.canvas as HTMLCanvasElement)
            canvas.width = 200
            canvas.height = 200
            const ctx = canvas.getContext('2d')
            const { x, y, width, height } = res.topCrop
            /* eslint-disable-next-line no-unused-expressions */
            ctx?.drawImage(img, x, y, width, height, 0, 0, 200, 200)
            this.updateCanvas({ id: this.id, image: canvas.toDataURL() })
          })
        })
      }
      img.crossOrigin = 'Anonymous'
      img.src = image
      this.image = image
    }
  }
})
</script>
