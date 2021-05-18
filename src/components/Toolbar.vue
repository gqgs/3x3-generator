<template>
    <progress v-if="upscaling" class="progress is-small is-primary my-4" :value="progress" max="100" />
    <div class="container is-max-desktop" id="bottom">
      <div class="columns">
        <div class="column">
          <label class="checkbox pt-2 is-size-7">
            <input type="checkbox" v-model="should_upscale">
            Upscale
          </label>
        </div>
        <div class="column">
              <div :class="{'is-active': activeDenoise}" class="dropdown is-up">
                <div class="dropdown-trigger">
                  <button class="button" aria-haspopup="true" aria-controls="denoise-dropdown-menu" :disabled="!should_upscale" @click="activeDenoise = !activeDenoise">
                    <span>{{humanize(denoise)}}</span>
                    <span class="icon is-small">
                      <ion-icon name="chevron-down-outline"></ion-icon>
                    </span>
                  </button>
                </div>
                <div class="dropdown-menu" id="denoise-dropdown-menu" role="menu">
                  <div class="dropdown-content">
                    <a href="#" :key='model' v-for="model in ['denoise0_model', 'denoise1_model', 'denoise2_model', 'denoise3_model']" @click.prevent="denoise = model; activeDenoise = false" class="dropdown-item">
                      {{humanize(model)}}
                    </a>
                  </div>
                </div>
            </div>
        </div>
        <div class="column">
            <div :class="{'is-active': activeDownload}" class="dropdown is-up">
            <div class="dropdown-trigger">
              <button class="button mb-2" aria-haspopup="true" aria-controls="download-dropdown-menu" @click="activeDownload = !activeDownload">
                <span v-if='upscaling'>{{progress_msg}}</span>
                <span v-else>Download image</span>
                <span class="icon is-small">
                  <ion-icon name="chevron-down-outline"></ion-icon>
                </span>
              </button>
            </div>
            <div class="dropdown-menu" id="download-dropdown-menu" role="menu">
              <div class="dropdown-content">
                <a href="#" :key='mime' v-for="mime in ['image/jpeg', 'image/png', 'image/webp']" @click.prevent="download(mime)" class="dropdown-item">
                  Download ({{mime}})
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="column">
          <div :class="{'is-active': activeSize}" class="dropdown is-up">
            <div class="dropdown-trigger">
              <button class="button mb-2" aria-haspopup="true" aria-controls="size-dropdown-menu" @click="activeSize = !activeSize">
                <span >{{size}}x{{size}}</span>
                <span class="icon is-small">
                  <ion-icon name="chevron-down-outline"></ion-icon>
                </span>
              </button>
            </div>
            <div class="dropdown-menu" id="size-dropdown-menu" role="menu">
              <div class="dropdown-content">
                <a href="#" :key='n' v-for="n in [2, 3, 4, 5]" @click.prevent="updateSize(n); activeSize = false" class="dropdown-item">
                  {{n}}x{{n}}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="column">
          <a href="https://github.com/gqgs/3x3-generator" target="_blank">
          <ion-icon class="pt-3" id="github" name="logo-octocat"></ion-icon>
          </a>
        </div>
      </div>
    </div>
</template>

<style scoped>
#bottom {
  max-width: 600px;
}

</style>

<script lang="ts">
import { ref, defineComponent, watch } from "vue"
import { mapState } from "vuex"
import { useStore } from "../store"
import fileDownload from "js-file-download"
import { upscaling, upscale, progress, progress_msg } from "../upscale"
import { Model } from "@/waifu2x"

export default defineComponent({
  setup () {
    const store = useStore()
    const activeDownload = ref(false)
    const activeDenoise = ref(false)
    const activeSize = ref(false)
    const should_upscale = ref(JSON.parse(localStorage.getItem("should_upscale") || "true"))
    const denoise = ref(localStorage.getItem("denoise") || "denoise1_model")
    const updateSize = (size: number) => store.dispatch("updateSize", size)

    watch(denoise, (denoise) => {
      store.state.cached_source = null
      localStorage.setItem("denoise", denoise)
    })

    watch(should_upscale, (should_upscale) => {
      store.state.cached_source = null
      localStorage.setItem("should_upscale", JSON.stringify(should_upscale))
    })

    const drawImages = async (): Promise<HTMLCanvasElement> => {
      const imageSize = 200
      const size = store.state.size
      const images = store.state.images
      const canvas = document.createElement("canvas")
      canvas.width = size * imageSize
      canvas.height = size * imageSize
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("could not get canvas context")
      ctx.strokeStyle = "white"
      for (let x = 0, i = 1; x < size; x++) {
        for (let y = 0; y < size; y++, i++) {
          if (i in images) {
            ctx.drawImage(images[i], 0, 0, imageSize, imageSize, y * imageSize, x * imageSize, imageSize, imageSize)
            ctx.strokeRect(y * imageSize, x * imageSize, imageSize, imageSize)
          }
        }
      }
      return canvas
    }

    const download = async (mimeType: string) => {
      activeDownload.value = false
      if (!store.state.cached_source) {
        const denoiseModel = `${denoise.value}.json` as Model
        const canvas = await drawImages()
        store.state.cached_source = should_upscale.value ? (await upscale(canvas, denoiseModel)) : canvas
      }
      const size = store.state.size
      store.state.cached_source.toBlob(blob => {
        if (blob == null) return
        let filename = `${size}x${size}`
        switch (mimeType) {
          case "image/png":
            filename = `${filename}.png`
            break
          case "image/webp":
            filename = `${filename}.webp`
            break
          default:
            filename = `${filename}.jpg`
        }
        fileDownload(blob, filename)
      }, mimeType)
    }

    const humanize = (text: string): string => {
      switch (text) {
        case "denoise0_model":
          return "low denoise"
        case "denoise1_model":
          return "medium denoise"
        case "denoise2_model":
          return "high denoise"
        case "denoise3_model":
          return "highest denoise"
      }
      return ""
    }

    return {
      activeDownload,
      activeDenoise,
      activeSize,
      download,
      upscaling,
      should_upscale,
      progress,
      progress_msg,
      denoise,
      updateSize,
      humanize
    }
  },
  computed: {
    ...mapState([
      "size",
      "images"
    ])
  }
})
</script>
