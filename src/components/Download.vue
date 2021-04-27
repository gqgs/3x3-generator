<template>
    <div :class="{'is-active': active}" class="dropdown is-up">
    <div class="dropdown-trigger">
      <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" @click="toggle">
        <span v-if='upscaling'>Upscaling image...</span>
        <span v-else>Download image</span>
        <span class="icon is-small">
          <ion-icon name="chevron-down-outline"></ion-icon>
        </span>
      </button>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu">
      <div class="dropdown-content">
        <a href="#" :key='mime' v-for="mime in ['image/jpeg', 'image/png', 'image/webp']" @click.prevent="download(mime)" class="dropdown-item">
          Download ({{mime}})
        </a>
      </div>
    </div>
  </div>
  <progress v-if="upscaling" class="progress is-small is-primary my-4" />
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'
import { useStore } from 'vuex'
import fileDownload from 'js-file-download'
import waifu2x from '../waifu2x'
import * as tf from '@tensorflow/tfjs'

export default defineComponent({
  setup () {
    const store = useStore()
    const canvas = store.state.canvas
    const active = ref(false)
    const upscaling = ref(false)

    canvas.width = 600
    canvas.height = 600

    const toggle = () => {
      active.value = !active.value
    }

    let model: tf.GraphModel | null = null

    const upscale = () : Promise<HTMLCanvasElement> => {
      return new Promise(resolve => {
        upscaling.value = true
        const img = new Image()
        img.onload = async () => {
          if (model === null) {
            model = await waifu2x.loadModel()
          }
          const upscale_canvas = document.createElement('canvas')
          upscale_canvas.width = img.width * 2
          upscale_canvas.height = img.height * 2
          const ctx = upscale_canvas.getContext('2d')
          if (ctx == null) return
          await waifu2x.enlarge(img, ctx, model)
          upscaling.value = false
          resolve(upscale_canvas)
        }
        img.src = (canvas as HTMLCanvasElement).toDataURL()
      })
    }

    const download = async (mimeType: string) => {
      (await upscale()).toBlob(blob => {
        if (blob == null) return
        let filename: string
        switch (mimeType) {
          case 'image/png':
            filename = '3x3gen.png'
            break
          case 'image/webp':
            filename = '3x3gen.webp'
            break
          default:
            filename = '3x3gen.jpg'
        }
        fileDownload(blob, filename)
        active.value = false
      }, mimeType)
    }

    return { active, toggle, download, upscaling }
  }
})
</script>
