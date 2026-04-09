<template>
  <div class="rounded-[2rem] border border-white/75 bg-white/78 p-3 text-slate-700 shadow-[0_24px_70px_rgba(148,163,184,0.32)] ring-1 ring-slate-200/70 backdrop-blur-xl" @click.stop>
    <div v-if="processing" class="mb-3 overflow-hidden rounded-full bg-slate-200/70">
      <div class="h-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 transition-all duration-300" :style="{ width: `${progress}%` }"></div>
    </div>
    <div class="grid gap-3 md:grid-cols-5 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto_auto]">
      <div class="relative">
        <button
          type="button"
          class="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-slate-100/75 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm hover:bg-white/90 xl:min-w-[150px]"
          @click.stop="select_color = !select_color"
        >
          <span>Border</span>
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
            <ion-icon :name="select_color ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
          </span>
        </button>
        <div
          v-if="select_color"
          class="absolute bottom-[calc(100%+0.75rem)] right-0 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-white/75 bg-white/92 p-4 text-slate-700 shadow-[0_20px_50px_rgba(148,163,184,0.35)] ring-1 ring-slate-200/70 backdrop-blur-xl"
          @click.stop
        >
          <div class="flex items-center gap-3 rounded-2xl border border-white/70 bg-slate-50/90 p-3">
            <input class="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-1" type="color" id="color" :value="color" @input="updateColor($event)">
            <input class="w-full accent-sky-400" type="range" :value="alpha" @input="updateAlpha($event)" />
          </div>
        </div>
      </div>
      <DropDown :options="['200', '400']" @clicked="cellSize = $event">
        <template v-slot:selected>
          <span>{{size*cellSize}}x{{size*cellSize}}</span>
        </template>
        <template v-slot:option="slotProps">
          {{size*parseInt(slotProps.option)}}x{{size*parseInt(slotProps.option)}}
        </template>
      </DropDown>
      <DropDown :options="['2', '3', '4', '5']" @clicked="updateSize($event)">
        <template v-slot:selected>
            <span >{{size}}x{{size}}</span>
        </template>
        <template v-slot:option="slotProps">
          {{slotProps.option}}x{{slotProps.option}}
        </template>
      </DropDown>
      <DropDown :options="downloadFormats" @clicked="download($event)">
        <template v-slot:selected>
          <span v-if='processing'>{{progress_msg}}</span>
          <span v-else class="inline-flex items-center gap-2">
            <span>Download</span>
          </span>
        </template>
        <template v-slot:option="slotProps">
          <span class="inline-flex items-center gap-2">
            <ion-icon name="download-outline"></ion-icon>
            <span>{{ formatMimeLabel(slotProps.option) }}</span>
          </span>
        </template>
      </DropDown>
      <div class="flex items-center justify-center rounded-2xl border border-white/70 bg-slate-100/70 p-2 xl:min-w-[72px]">
        <a
          href="https://github.com/gqgs/3x3-generator"
          target="_blank"
          aria-label="Open GitHub repository"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-xl text-slate-600 shadow-sm hover:bg-white"
        >
          <ion-icon id="github" name="logo-octocat"></ion-icon>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, watch, onMounted, onBeforeUnmount } from "vue"
import { mapState } from "vuex"
import { useStore } from "../store"
import fileDownload from "js-file-download"
import { scaleImage } from "../image"
import DropDown from "./DropDown.vue"

export default defineComponent({
  components: {
    DropDown
  },
  setup () {
    const store = useStore()
    const cellSize = ref<number>(JSON.parse(localStorage.getItem("cellSize") || "400"))
    const updateSize = (size: number) => store.dispatch("updateSize", size)
    const updateColor = (event: Event) => store.dispatch("updateColor", (event.target as HTMLInputElement).value)
    const updateAlpha = (event: Event) => store.dispatch("updateAlpha", (event.target as HTMLInputElement).value)
    const progress = ref(0)
    const progress_msg = "Creating image..."
    const processing = ref(false)
    const select_color = ref(false)
    const downloadFormats = ["image/jpeg", "image/png", "image/webp"]
    const selectedDownloadFormatLabel = "JPG"
    const formatMimeLabel = (mimeType: string) => {
      switch (mimeType) {
        case "image/png":
          return "PNG"
        case "image/webp":
          return "WEBP"
        default:
          return "JPG"
      }
    }
    const handleWindowClick = () => {
      select_color.value = false
    }

    onMounted(() => window.addEventListener("click", handleWindowClick))
    onBeforeUnmount(() => window.removeEventListener("click", handleWindowClick))

    watch(cellSize, (cellSize) => {
      store.state.cached_source = null
      localStorage.setItem("cellSize", JSON.stringify(cellSize))
    })

    const drawImages = async (): Promise<HTMLCanvasElement> => {
      const imageSize = cellSize.value
      const size = store.state.size
      const images = store.state.images
      const canvas = document.createElement("canvas")
      canvas.width = size * imageSize
      canvas.height = size * imageSize
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("could not get canvas context")
      ctx.strokeStyle = store.getters.color

      const upscaleFunc = () => {
        let i = 0
        return async (image: ImageBitmap): Promise<ImageBitmap> => {
          const result = await scaleImage(image, imageSize)
          progress.value = (++i) / Object.keys(images).length * 100
          return result
        }
      }
      const upscale = upscaleFunc()
      const upscale_jobs = new Map<string, Promise<ImageBitmap>>()

      for (const i of Object.keys(images)) {
        if (images[i]?.bitmap) {
          upscale_jobs.set(i, upscale(images[i].bitmap))
        }
      }
      await Promise.all(Object.values(upscale_jobs))

      for (let x = 0, i = 1; x < size; x++) {
        for (let y = 0; y < size; y++, i++) {
          const upscaled = upscale_jobs.get(i.toString())
          if (upscaled) {
            ctx.drawImage(await upscaled, 0, 0, imageSize, imageSize, y * imageSize, x * imageSize, imageSize, imageSize)
            ctx.strokeRect(y * imageSize, x * imageSize, imageSize, imageSize)
          }
        }
      }
      return canvas
    }

    const download = async (mimeType: string) => {
      if (!store.state.cached_source) {
        progress.value = 0
        processing.value = true
        store.state.cached_source = await drawImages()
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

    return {
      download,
      cellSize,
      progress,
      progress_msg,
      updateSize,
      updateColor,
      updateAlpha,
      processing,
      downloadFormats,
      selectedDownloadFormatLabel,
      formatMimeLabel,
      select_color
    }
  },
  computed: {
    ...mapState([
      "size",
      "images",
      "color",
      "alpha"
    ])
  }
})
</script>
