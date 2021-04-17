<template>
<a href="#" @click.prevent="showSearch({id: id, updater: update})">
  <canvas v-if="image" ref="canvas" :title="title" />
  <ion-icon v-else class="is-size-1" name="images-outline" />
</a>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import { Update } from '../types'

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
          const canvas = (this.$refs.canvas as HTMLCanvasElement)
          canvas.width = 200
          canvas.height = 200
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, 200, 200)
          this.updateCanvas({ id: this.id, image: canvas.toDataURL() })
        })
      }
      img.src = image
      this.image = image
    }
  }
})
</script>
