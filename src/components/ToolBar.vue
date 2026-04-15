<template>
  <div class="relative rounded-[2rem] border border-white/75 bg-white/78 p-3 text-slate-700 shadow-[0_24px_70px_rgba(148,163,184,0.32)] ring-1 ring-slate-200/70 backdrop-blur-xl" @click.stop>
    <div v-if="downloading" class="mb-3 overflow-hidden rounded-full bg-slate-200/70">
      <div class="h-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 transition-all duration-300" :style="{ width: `${progress}%` }"></div>
    </div>

    <!-- Advanced Panel - Positioned relative to the entire toolbar -->
    <transition name="fade">
      <div
        v-if="advancedOpen"
        class="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-30 max-h-[60vh] overflow-y-auto rounded-[2rem] border border-white/75 bg-white/95 p-5 pb-20 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/70 backdrop-blur-2xl sm:left-auto sm:right-0 sm:w-[320px]"
        @click.stop
      >
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Advanced Settings</h3>
          <button @click="advancedOpen = false" class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>
        
        <div class="space-y-6">
          <div>
            <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Grid Size</p>
            <DropDown direction="down" :options="['2', '3', '4', '5']" :disabled="downloading" @clicked="updateSize(parseInt($event))">
              <template v-slot:selected>
                <span>{{size}}x{{size}} Grid</span>
              </template>
              <template v-slot:option="slotProps">
                {{slotProps.option}}x{{slotProps.option}}
              </template>
            </DropDown>
          </div>
          <div>
            <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Upscale Model</p>
            <DropDown direction="down" :options="['Swin2SR', '6B', 'HFA2kShallowESRGAN']" :disabled="downloading" @clicked="updateModel($event)">
              <template v-slot:selected>
                <span>{{ upscaleModel === '6B' ? 'High Quality' : (upscaleModel === 'HFA2kShallowESRGAN' ? 'Fast' : 'Balanced') }}</span>
              </template>
              <template v-slot:option="slotProps">
                {{ slotProps.option === '6B' ? 'High Quality' : (slotProps.option === 'HFA2kShallowESRGAN' ? 'Fast' : 'Balanced') }} <small class="opacity-60">{{ slotProps.option === '6B' ? '(Real-ESRGAN)' : (slotProps.option === 'HFA2kShallowESRGAN' ? '(HFA2k)' : '(Swin2SR)') }}</small>
              </template>
            </DropDown>
          </div>
          <div>
            <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Worker Pool Size</p>
            <DropDown direction="down" :options="['1', '3', '6', '9']" :disabled="downloading" @clicked="updateWorkers($event)">
              <template v-slot:selected>
                <span>{{ workerCount }} Workers</span>
              </template>
              <template v-slot:option="slotProps">
                {{ slotProps.option }} Workers
              </template>
            </DropDown>
          </div>
          <div>
            <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Image Processing</p>
            <button
              type="button"
              @click="updateForceUpscale(!forceUpscale)"
              :disabled="downloading"
              class="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-slate-50/90 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-inner hover:bg-white/90 disabled:opacity-50"
            >
              <span>Force Upscale</span>
              <div
                class="relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out"
                :class="forceUpscale ? 'bg-sky-400' : 'bg-slate-300'"
              >
                <div
                  class="absolute left-1 top-1 h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out"
                  :class="forceUpscale ? 'translate-x-5' : 'translate-x-0'"
                ></div>
              </div>
            </button>
          </div>
          <div>
            <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Title Overlay</p>
            <button
              type="button"
              @click="updateIncludeTitles(!includeTitles)"
              :disabled="downloading"
              class="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-slate-50/90 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-inner hover:bg-white/90 disabled:opacity-50"
            >
              <span>Include Titles</span>
              <div
                class="relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out"
                :class="includeTitles ? 'bg-sky-400' : 'bg-slate-300'"
              >
                <div
                  class="absolute left-1 top-1 h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out"
                  :class="includeTitles ? 'translate-x-5' : 'translate-x-0'"
                ></div>
              </div>
            </button>
          </div>
          <div>
            <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Border Appearance</p>
            <div class="flex items-center gap-3 rounded-2xl border border-white/70 bg-slate-50/90 p-3 shadow-inner">
              <input class="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-1" type="color" id="color" :value="color" @input="updateColor($event)">
              <input class="w-full accent-sky-400" type="range" :value="alpha" @input="updateAlpha($event)" />
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      <DropDown :options="projectOptions" :disabled="downloading" @clicked="handleProjectAction($event)">
        <template v-slot:selected>
          <span class="truncate">Project</span>
        </template>
        <template v-slot:option="slotProps">
          <span class="inline-flex items-center gap-2">
            <ion-icon :name="slotProps.option === 'import' ? 'folder-open-outline' : 'save-outline'"></ion-icon>
            <span>{{ slotProps.option === 'import' ? 'Import' : 'Export' }}</span>
          </span>
        </template>
      </DropDown>

      <DropDown :options="['200', '400']" :disabled="downloading" @clicked="cellSize = parseInt($event)">
        <template v-slot:selected>
          <span class="truncate">{{size}}x{{size}} ({{size*cellSize}}px)</span>
        </template>
        <template v-slot:option="slotProps">
          {{size}}x{{size}} ({{size*parseInt(slotProps.option)}}px) <small v-if="slotProps.option === '400'" class="opacity-60">(upscale)</small>
        </template>
      </DropDown>

      <DropDown :options="downloadFormats" @clicked="download($event)">
        <template v-slot:selected>
          <span v-if='downloading' class="truncate">Processing...</span>
          <span v-else class="truncate">Download</span>
        </template>
        <template v-slot:option="slotProps">
          <span class="inline-flex items-center gap-2">
            <ion-icon name="download-outline"></ion-icon>
            <span>{{ formatMimeLabel(slotProps.option) }}</span>
          </span>
        </template>
      </DropDown>

      <button
        type="button"
        class="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-slate-100/75 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm hover:bg-white/90"
        @click.stop="advancedOpen = !advancedOpen"
      >
        <span class="truncate">Advanced</span>
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
          <ion-icon :name="advancedOpen ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
        </span>
      </button>
    </div>

    <div class="mt-3 flex justify-center border-t border-white/70 pt-3">
      <a
        href="https://github.com/gqgs/3x3-generator"
        target="_blank"
        aria-label="Open GitHub repository"
        class="inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 hover:bg-white/70 hover:text-slate-800"
      >
        <ion-icon class="text-base" name="logo-octocat"></ion-icon>
        <span>GitHub</span>
      </a>
    </div>

    <input
      ref="projectInput"
      class="hidden"
      type="file"
      accept=".json,.3x3.json,application/json"
      @change="handleProjectFile"
    >
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, watch, onMounted, onBeforeUnmount } from "vue"
import { mapState } from "vuex"
import { useStore } from "../store"
import fileDownload from "js-file-download"
import { scaleImage, releasePool, setWorkerCount, getWorkerCount } from "../image"
import { buildCaptionLayout, captionMetrics } from "../image/captions"
import DropDown from "./DropDown.vue"
import Api from "../api"
import { createProject, hydrateProject, parseProject } from "../project"

export default defineComponent({
  components: {
    DropDown
  },
  setup () {
    const store = useStore()
    const advancedOpen = ref(false)
    const cellSize = ref<number>(JSON.parse(localStorage.getItem("cellSize") || "400"))
    const projectInput = ref<HTMLInputElement | null>(null)
    const updateSize = (size: number) => store.dispatch("updateSize", size)
    const updateColor = (event: Event) => store.dispatch("updateColor", (event.target as HTMLInputElement).value)
    const updateAlpha = (event: Event) => store.dispatch("updateAlpha", (event.target as HTMLInputElement).value)
    
    const updateModel = async (model: '6B' | 'Swin2SR' | 'HFA2kShallowESRGAN') => {
      if (store.state.downloading) return
      await releasePool()
      store.commit("setUpscaleModel", model)
    }

    const updateWorkers = (count: string) => {
      const n = parseInt(count)
      setWorkerCount(n)
      store.commit("setWorkerCount", n)
    }

    const updateForceUpscale = (force: boolean) => {
      store.commit("setForceUpscale", force)
    }

    const updateIncludeTitles = (includeTitles: boolean) => {
      store.commit("setIncludeTitles", includeTitles)
    }

    const downloadFormats = ["image/jpeg", "image/png", "image/webp"]
    const projectOptions = ["import", "export"]
    const formatMimeLabel = (mimeType: string) => {
      switch (mimeType) {
        case "image/png": return "PNG"
        case "image/webp": return "WEBP"
        default: return "JPG"
      }
    }
    const handleWindowClick = () => {
      advancedOpen.value = false
    }

    onMounted(() => window.addEventListener("click", handleWindowClick))
    onBeforeUnmount(() => window.removeEventListener("click", handleWindowClick))

    watch(cellSize, (cellSize) => {
      store.state.cached_source = null
      localStorage.setItem("cellSize", JSON.stringify(cellSize))
    })

    const exportProject = () => {
      const project = createProject(store.state, {
        cellSize: parseInt(cellSize.value.toString()),
        search: Api.getSearchState()
      })
      fileDownload(JSON.stringify(project, null, 2), "3x3-project.3x3.json", "application/json")
    }

    const importProject = async (file: File) => {
      const project = parseProject(await file.text())
      if (Object.keys(store.state.images).length > 0) {
        const shouldReplace = window.confirm("Importing this project will replace your current grid.")
        if (!shouldReplace) return
      }

      const hydrated = await hydrateProject(project)
      await releasePool()
      setWorkerCount(hydrated.settings.workerCount)
      cellSize.value = hydrated.settings.cellSize
      store.commit("restoreProject", {
        size: hydrated.settings.size,
        images: hydrated.images,
        color: hydrated.settings.color,
        alpha: hydrated.settings.alpha,
        upscaleModel: hydrated.settings.upscaleModel,
        workerCount: hydrated.settings.workerCount,
        forceUpscale: hydrated.settings.forceUpscale,
        includeTitles: hydrated.settings.includeTitles,
        selectedId: hydrated.settings.selectedId
      })
      Api.restoreSearchState(hydrated.search)
    }

    const handleProjectAction = (action: string) => {
      if (action === "import") {
        projectInput.value?.click()
        return
      }
      exportProject()
    }

    const handleProjectFile = async (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (!file) return
      try {
        await importProject(file)
      } catch (err) {
        console.error("Project import failed:", err)
        window.alert(err instanceof Error ? err.message : "Project import failed.")
      } finally {
        input.value = ""
      }
    }

    const drawImages = async (): Promise<HTMLCanvasElement> => {
      const imageSize = cellSize.value
      const size = store.state.size
      const images = store.state.images
      const upscaleModel = store.state.upscaleModel
      const forceUpscale = store.state.forceUpscale
      const canvas = document.createElement("canvas")
      canvas.width = size * imageSize
      canvas.height = size * imageSize
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("could not get canvas context")
      ctx.strokeStyle = store.getters.color

      const tilePosition = (id: string) => {
        const index = parseInt(id) - 1
        return {
          left: (index % size) * imageSize,
          top: Math.floor(index / size) * imageSize
        }
      }

      const drawCaption = (title: string | undefined, left: number, top: number) => {
        const caption = (title || "").trim()
        if (!store.state.includeTitles || !caption) return

        ctx.save()
        ctx.translate(left, top)
        const metrics = captionMetrics(imageSize)
        ctx.font = `600 ${metrics.fontSize}px Avenir Next, Montserrat, Segoe UI, sans-serif`
        const measureWithFont = (text: string) => ctx.measureText(text).width
        const layout = buildCaptionLayout(caption, imageSize, measureWithFont)
        if (layout.lines.length === 0) {
          ctx.restore()
          return
        }

        const veilTop = imageSize - layout.veilHeight
        const gradient = ctx.createLinearGradient(0, veilTop, 0, imageSize)
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
        gradient.addColorStop(0.34, "rgba(0, 0, 0, 0.48)")
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.78)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, veilTop, imageSize, layout.veilHeight)

        const textHeight = layout.lines.length * layout.lineHeight
        const firstBaseline = imageSize - layout.paddingY - textHeight + layout.fontSize
        ctx.fillStyle = "#ffffff"
        ctx.shadowColor = "rgba(0, 0, 0, 0.85)"
        ctx.shadowBlur = 2
        ctx.shadowOffsetY = 1
        layout.lines.forEach((line, index) => {
          ctx.fillText(line, layout.paddingX, firstBaseline + index * layout.lineHeight)
        })
        ctx.restore()
      }

      const queue = Object.keys(images)
        .filter(id => images[id]?.bitmap)
        .sort((a, b) => {
          if (forceUpscale) return 0
          const aNeedsUpscale = images[a].bitmap.width < imageSize || images[a].bitmap.height < imageSize
          const bNeedsUpscale = images[b].bitmap.width < imageSize || images[b].bitmap.height < imageSize
          if (aNeedsUpscale === bNeedsUpscale) return 0
          return aNeedsUpscale ? 1 : -1
        })

      const totalCount = queue.length
      const upscale_jobs = new Map<string, Promise<ImageBitmap>>()
      const imageProgress = new Map<string, number>()
      const updateGlobalProgress = () => {
        let total = 0
        imageProgress.forEach(p => total += p)
        store.commit("setProgress", total / totalCount)
      }

      const CONCURRENCY_LIMIT = getWorkerCount()
      const processQueue = async () => {
        while (queue.length > 0) {
          const id = queue.shift()
          if (!id) break
          
          const job = scaleImage(images[id].bitmap, imageSize, upscaleModel, forceUpscale, (percent) => {
            imageProgress.set(id, percent)
            updateGlobalProgress()
          }).then(result => {
            imageProgress.set(id, 100)
            updateGlobalProgress()
            return result
          })
          
          upscale_jobs.set(id, job)
          await job // Wait for this image to finish before taking next from queue
        }
      }

      const workers = Array(CONCURRENCY_LIMIT).fill(null).map(() => processQueue())
      await Promise.all(workers)

      const drawnTileIds: string[] = []
      for (let i = 1; i <= size * size; i++) {
        const id = i.toString()
        const upscaledPromise = upscale_jobs.get(id)
        if (upscaledPromise) {
          const upscaled = await upscaledPromise
          const { left, top } = tilePosition(id)
          ctx.drawImage(upscaled, 0, 0, imageSize, imageSize, left, top, imageSize, imageSize)
          ctx.strokeRect(left, top, imageSize, imageSize)
          drawnTileIds.push(id)
          // Close the upscaled bitmap to free memory
          upscaled.close()
        }
      }

      for (const id of drawnTileIds) {
        const { left, top } = tilePosition(id)
        drawCaption(images[id].title || `Image ${id}`, left, top)
        ctx.strokeRect(left, top, imageSize, imageSize)
      }
      return canvas
    }

    const download = async (mimeType: string) => {
      if (store.state.downloading) return
      try {
        if (!store.state.cached_source) {
          store.commit("setProgress", 0)
          store.commit("setDownloading", true)
          store.state.cached_source = await drawImages()
        }
        const size = store.state.size
        store.state.cached_source.toBlob(blob => {
          if (blob == null) return
          let filename = `${size}x${size}`
          switch (mimeType) {
            case "image/png": filename = `${filename}.png`; break
            case "image/webp": filename = `${filename}.webp`; break
            default: filename = `${filename}.jpg`
          }
          fileDownload(blob, filename)
        }, mimeType)
      } catch (err) {
        console.error("Download failed:", err)
      } finally {
        store.commit("setDownloading", false)
      }
    }

    return {
      download,
      cellSize,
      updateSize,
      updateColor,
      updateAlpha,
      updateModel,
      updateWorkers,
      updateForceUpscale,
      updateIncludeTitles,
      downloadFormats,
      projectOptions,
      projectInput,
      handleProjectAction,
      handleProjectFile,
      formatMimeLabel,
      advancedOpen
    }
  },
  computed: {
    ...mapState([
      "size",
      "images",
      "color",
      "alpha",
      "downloading",
      "progress",
      "upscaleModel",
      "workerCount",
      "forceUpscale",
      "includeTitles"
    ])
  }
})
</script>
