<template>
    <progress v-if="upscaling" class="progress is-small is-primary my-4" :value="progress" max="100" />

    <div class="container is-max-desktop" id="bottom">
      <div class="columns">
        <div class="column is-one-third">
          <label class="checkbox is-size-7">
            <input type="checkbox" v-model="should_upscale">
            Upscale + {{denoise}}
          </label>
        </div>
        <div class="column is-one-fifth">
              <div :class="{'is-active': activeDenoise}" class="dropdown is-up">
                <div class="dropdown-trigger">
                  <button class="button" aria-haspopup="true" aria-controls="denoise-dropdown-menu" @click="toggleDenoise">
                    <span>Denoise</span>
                    <span class="icon is-small">
                      <ion-icon name="chevron-down-outline"></ion-icon>
                    </span>
                  </button>
                </div>
                <div class="dropdown-menu" id="denoise-dropdown-menu" role="menu">
                  <div class="dropdown-content">
                    <a href="#" :key='model' v-for="model in ['denoise0_model', 'denoise1_model', 'denoise2_model', 'denoise3_model']" @click.prevent="denoise = model; activeDenoise = false" class="dropdown-item">
                      {{model}}
                    </a>
                  </div>
                </div>
            </div>
        </div>
        <div class="column is-one-quarter">
            <div :class="{'is-active': activeDownload}" class="dropdown is-up">
            <div class="dropdown-trigger">
              <button class="button mb-2" aria-haspopup="true" aria-controls="download-dropdown-menu" @click="toggleDownload">
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
        <div class="column is-one-quarter">
          <a href="https://github.com/gqgs/3x3-generator" target="_blank">
          <ion-icon class="pt-4" id="github" name="logo-octocat"></ion-icon>
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
import { useStore } from "vuex"
import fileDownload from "js-file-download"
import { upscaling, upscale, progress, progress_msg } from "../upscale"
import { Model } from "@/waifu2x"

export default defineComponent({
  setup () {
    const store = useStore()
    const canvas = store.state.canvas
    const activeDownload = ref(false)
    const activeDenoise = ref(false)
    const should_upscale = ref(JSON.parse(localStorage.getItem("should_upscale") || "true"))
    const denoise = ref(localStorage.getItem("denoise") || "denoise2_model")

    canvas.width = 600
    canvas.height = 600

    const toggleDenoise = () => {
      activeDenoise.value = !activeDenoise.value
    }

    const toggleDownload = () => {
      activeDownload.value = !activeDownload.value
    }

    watch(denoise, (denoise) => {
      localStorage.setItem("denoise", denoise)
    })

    watch(should_upscale, (should_upscale) => {
      localStorage.setItem("should_upscale", JSON.stringify(should_upscale))
    })

    const download = async (mimeType: string) => {
      const denoiseModel = `${denoise.value}.json` as Model
      activeDownload.value = false
      const source = should_upscale.value ? (await upscale(canvas, denoiseModel)) : (canvas as HTMLCanvasElement)
      source.toBlob(blob => {
        if (blob == null) return
        let filename: string
        switch (mimeType) {
          case "image/png":
            filename = "3x3.png"
            break
          case "image/webp":
            filename = "3x3.webp"
            break
          default:
            filename = "3x3.jpg"
        }
        fileDownload(blob, filename)
      }, mimeType)
    }

    return { activeDownload, toggleDownload, activeDenoise, toggleDenoise, download, upscaling, should_upscale, progress, progress_msg, denoise }
  }
})
</script>
