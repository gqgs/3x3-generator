<template>
    <progress v-if="processing" class="progress is-small is-primary my-4" :value="progress" max="100" />
    <div class="container is-max-desktop" id="bottom">
      <div class="columns is-gapless">
        <DropDown class="column" :options="[200, 400]" @clicked="cellSize = $event">
          <template v-slot:selected>
            <span>{{size*cellSize}}x{{size*cellSize}}</span>
          </template>
          <template v-slot:option="slotProps">
            {{size*slotProps.option}}x{{size*slotProps.option}}
          </template>
        </DropDown>
        <DropDown class="column" :options="['denoise0_model', 'denoise1_model', 'denoise2_model', 'denoise3_model']" @clicked="denoise = $event">
          <template v-slot:selected>
            <span>{{humanize(denoise)}}</span>
          </template>
          <template v-slot:option="slotProps">
            {{humanize(slotProps.option)}}
          </template>
        </DropDown>
        <DropDown class="column" :options="['image/jpeg', 'image/png', 'image/webp']" @clicked="download($event)">
          <template v-slot:selected>
            <span v-if='processing'>{{progress_msg}}</span>
            <span v-else>Download image</span>
          </template>
          <template v-slot:option="slotProps">
            Download ({{slotProps.option}})
          </template>
        </DropDown>
        <DropDown class="column" :options="[2, 3, 4, 5]" @clicked="updateSize($event)">
          <template v-slot:selected>
              <span >{{size}}x{{size}}</span>
          </template>
          <template v-slot:option="slotProps">
            {{slotProps.option}}x{{slotProps.option}}
          </template>
        </DropDown>
        <div class="column">
          <input class="button is-small" type="color" id="color" :value="color" @input="updateColor($event.target.value)">
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

#color {
  width: 100%
}

.column {
  padding: 10px 2px;
}

@media (max-width: 768px) {
  #color {
    width: 150px;
  }

  .column {
    padding: 5px;
  }
}

</style>

<script lang="ts">
import { ref, defineComponent, watch } from "vue"
import { mapState } from "vuex"
import { useStore } from "../store"
import fileDownload from "js-file-download"
import { Model } from "../image/waifu2x"
import { scaleImage } from "../image"
import DropDown from "./DropDown.vue"

export default defineComponent({
  components: {
    DropDown
  },
  setup () {
    const store = useStore()
    const cellSize = ref(JSON.parse(localStorage.getItem("cellSize") || "400"))
    const denoise = ref(localStorage.getItem("denoise") || "denoise1_model")
    const updateSize = (size: number) => store.dispatch("updateSize", size)
    const updateColor = (color: string) => store.dispatch("updateColor", color)
    const progress = ref(0)
    const progress_msg = "Creating image..."
    const processing = ref(false)

    watch(denoise, (denoise) => {
      store.state.cached_source = null
      localStorage.setItem("denoise", denoise)
    })

    watch(cellSize, (cellSize) => {
      store.state.cached_source = null
      localStorage.setItem("cellSize", JSON.stringify(cellSize))
    })

    const drawImages = async (denoiseModel: Model): Promise<HTMLCanvasElement> => {
      const imageSize = cellSize.value
      const size = store.state.size
      const images = store.state.images
      const canvas = document.createElement("canvas")
      canvas.width = size * imageSize
      canvas.height = size * imageSize
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("could not get canvas context")
      ctx.strokeStyle = store.state.color
      for (let x = 0, i = 1; x < size; x++) {
        for (let y = 0; y < size; y++, i++) {
          if (i in images) {
            ctx.drawImage(await scaleImage(images[i], imageSize, denoiseModel), 0, 0, imageSize, imageSize, y * imageSize, x * imageSize, imageSize, imageSize)
            ctx.strokeRect(y * imageSize, x * imageSize, imageSize, imageSize)
          }
          progress.value = (i + 1) / (size * size) * 100
        }
      }
      return canvas
    }

    const download = async (mimeType: string) => {
      if (!store.state.cached_source) {
        progress.value = 0
        processing.value = true
        const denoiseModel = `${denoise.value}.json` as Model
        store.state.cached_source = await drawImages(denoiseModel)
        processing.value = false
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
      download,
      cellSize,
      progress,
      progress_msg,
      denoise,
      updateSize,
      humanize,
      updateColor,
      processing
    }
  },
  computed: {
    ...mapState([
      "size",
      "images",
      "color"
    ])
  }
})
</script>
