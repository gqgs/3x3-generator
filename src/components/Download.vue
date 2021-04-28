<template>
    <label class="checkbox pr-4 py-2">
      <input type="checkbox" v-model="should_upscale">
      Upscale
    </label>
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
import { ref, defineComponent, watch } from 'vue'
import { useStore } from 'vuex'
import fileDownload from 'js-file-download'

import Worker from 'worker-loader!./../waifu2x.worker'
import waifu2x from '../waifu2x'

interface UpscaleImage {
  image: ImageData
  x: number
  y: number
}

export default defineComponent({
  setup () {
    const store = useStore()
    const canvas = store.state.canvas
    const active = ref(false)
    const upscaling = ref(false)
    const should_upscale = ref(JSON.parse(localStorage.getItem('should_upscale') || 'true'))
    const has_offscreen_canvas_support = typeof document.createElement('canvas').transferControlToOffscreen === 'function'

    canvas.width = 600
    canvas.height = 600

    const toggle = () => {
      active.value = !active.value
    }

    watch(should_upscale, (should_upscale) => {
      localStorage.setItem('should_upscale', JSON.stringify(should_upscale))
    })

    const processResult = (result: UpscaleImage[], width: number, height: number) : Promise<HTMLCanvasElement> => {
      return new Promise(resolve => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        result.forEach(({ image, x, y }: UpscaleImage) => {
          ctx?.putImageData(image, x, y)
        })
        upscaling.value = false
        resolve(canvas)
      })
    }

    const upscalefallback = () : Promise<HTMLCanvasElement> => {
      return new Promise(resolve => {
        const img = new Image()
        img.onload = async () => {
          const c = document.createElement('canvas')
          c.width = img.width
          c.height = img.height
          const ctx = c.getContext('2d')
          ctx?.drawImage(img, 0, 0, img.width, img.height)

          const image_data = ctx?.getImageData(0, 0, img.width, img.height)
          if (image_data === undefined) return

          const model = await waifu2x.loadModel()
          const result = await waifu2x.enlarge(image_data, model)

          resolve(await processResult(result, img.width * 2, img.height * 2))
        }
        img.src = (canvas as HTMLCanvasElement).toDataURL()
      })
    }

    const upscale = () : Promise<HTMLCanvasElement> => {
      upscaling.value = true
      active.value = false

      if (!has_offscreen_canvas_support) {
        return upscalefallback()
      }

      return new Promise(resolve => {
        const worker = new Worker()
        worker.onmessage = async (event: MessageEvent) => {
          worker.terminate()
          const { result, width, height } = event.data
          resolve(await processResult(result, width, height))
        }

        const img = new Image()
        img.onload = async () => {
          const c = document.createElement('canvas')
          c.width = img.width
          c.height = img.height
          const ctx = c.getContext('2d')
          ctx?.drawImage(img, 0, 0, img.width, img.height)
          worker.postMessage({
            image_data: ctx?.getImageData(0, 0, img.width, img.height),
            width: c.width,
            height: c.height
          })
        }
        img.src = (canvas as HTMLCanvasElement).toDataURL()
      })
    }

    const download = async (mimeType: string) => {
      active.value = false
      const source = should_upscale.value ? (await upscale()) : (canvas as HTMLCanvasElement)
      source.toBlob(blob => {
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
      }, mimeType)
    }

    return { active, toggle, download, upscaling, should_upscale }
  }
})
</script>
