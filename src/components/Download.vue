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
import { upscaling, upscale } from '../upscale'

export default defineComponent({
  setup () {
    const store = useStore()
    const canvas = store.state.canvas
    const active = ref(false)
    const should_upscale = ref(JSON.parse(localStorage.getItem('should_upscale') || 'true'))

    canvas.width = 600
    canvas.height = 600

    const toggle = () => {
      active.value = !active.value
    }

    watch(should_upscale, (should_upscale) => {
      localStorage.setItem('should_upscale', JSON.stringify(should_upscale))
    })

    const download = async (mimeType: string) => {
      active.value = false
      const source = should_upscale.value ? (await upscale(canvas)) : (canvas as HTMLCanvasElement)
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
