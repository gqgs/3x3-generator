<template>
  <div class="rounded-[2rem] border border-white/75 bg-white/78 p-3 text-slate-700 shadow-[0_24px_70px_rgba(148,163,184,0.32)] ring-1 ring-slate-200/70 backdrop-blur-xl" @click.stop>
    <div v-if="downloading" class="mb-3 overflow-hidden rounded-full bg-slate-200/70">
      <div class="h-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 transition-all duration-300" :style="{ width: `${progress}%` }"></div>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="relative">
        <button
          type="button"
          class="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-slate-100/75 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm hover:bg-white/90"
          @click.stop="advancedOpen = !advancedOpen"
        >
          <span>Advanced</span>
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
            <ion-icon :name="advancedOpen ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
          </span>
        </button>
        
        <transition name="fade">
          <div
            v-if="advancedOpen"
            class="absolute bottom-[calc(100%+0.75rem)] left-0 z-30 w-full min-w-[280px] rounded-[1.5rem] border border-white/75 bg-white/95 p-4 text-slate-700 shadow-[0_20px_50px_rgba(148,163,184,0.35)] ring-1 ring-slate-200/70 backdrop-blur-xl"
            @click.stop
          >
            <div class="space-y-5">
              <div>
                <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Grid Size</p>
                <DropDown :options="['2', '3', '4', '5']" :disabled="downloading" @clicked="updateSize($event)">
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
                <DropDown :options="['Swin2SR', '6B', 'HFA2kShallowESRGAN']" :disabled="downloading" @clicked="updateModel($event)">
                  <template v-slot:selected>
                    <span>{{ upscaleModel === '6B' ? 'High Quality' : (upscaleModel === 'HFA2kShallowESRGAN' ? 'Fast' : 'Balanced') }}</span>
                  </template>
                  <template v-slot:option="slotProps">
                    {{ slotProps.option === '6B' ? 'High Quality' : (slotProps.option === 'HFA2kShallowESRGAN' ? 'Fast' : 'Balanced') }} <small>{{ slotProps.option === '6B' ? '(Real-ESRGAN)' : (slotProps.option === 'HFA2kShallowESRGAN' ? '(HFA2k)' : '(Swin2SR)') }}</small>
                  </template>
                </DropDown>
              </div>
              <div>
                <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Worker Pool Size</p>
                <DropDown :options="['1', '3', '6', '9']" :disabled="downloading" @clicked="updateWorkers($event)">
                  <template v-slot:selected>
                    <span>{{ workerCount }} Workers</span>
                  </template>
                  <template v-slot:option="slotProps">
                    {{ slotProps.option }} Workers
                  </template>
                </DropDown>
              </div>
              <div>
                <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Visual Consistency</p>
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
                <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Border Appearance</p>
                <div class="flex items-center gap-3 rounded-2xl border border-white/70 bg-slate-50/90 p-3 shadow-inner">
                  <input class="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-1" type="color" id="color" :value="color" @input="updateColor($event)">
                  <input class="w-full accent-sky-400" type="range" :value="alpha" @input="updateAlpha($event)" />
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <DropDown :options="['200', '400']" :disabled="downloading" @clicked="cellSize = $event">
        <template v-slot:selected>
          <span>{{size}}x{{size}} ({{size*cellSize}}px)</span>
        </template>
        <template v-slot:option="slotProps">
          {{size}}x{{size}} ({{size*parseInt(slotProps.option)}}px) <small v-if="slotProps.option === '400'">(upscaled)</small>
        </template>
      </DropDown>

      <DropDown :options="projectOptions" :disabled="downloading" @clicked="handleProjectAction($event)">
        <template v-slot:selected>
          <span>Import/Export</span>
        </template>
        <template v-slot:option="slotProps">
          <span class="inline-flex items-center gap-2">
            <ion-icon :name="slotProps.option === 'import' ? 'folder-open-outline' : 'save-outline'"></ion-icon>
            <span>{{ slotProps.option === 'import' ? 'Import' : 'Export' }}</span>
          </span>
        </template>
      </DropDown>

      <input
        ref="projectInput"
        class="hidden"
        type="file"
        accept=".json,.3x3.json,application/json"
        @change="handleProjectFile"
      >

      <div class="flex gap-2">
        <div class="min-w-0 flex-1">
          <DropDown :options="downloadFormats" @clicked="download($event)">
            <template v-slot:selected>
              <span v-if='downloading'>Processing...</span>
              <span v-else>Download</span>
            </template>
            <template v-slot:option="slotProps">
              <span class="inline-flex items-center gap-2">
                <ion-icon name="download-outline"></ion-icon>
                <span>{{ formatMimeLabel(slotProps.option) }}</span>
              </span>
            </template>
          </DropDown>
        </div>
        <a
          href="https://github.com/gqgs/3x3-generator"
          target="_blank"
          aria-label="Open GitHub repository"
          class="flex min-h-11 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-slate-100/75 text-xl text-slate-700 shadow-sm hover:bg-white/90 hover:text-slate-900"
        >
          <ion-icon name="logo-octocat"></ion-icon>
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
import { scaleImage, releasePool, setWorkerCount, getWorkerCount } from "../image"
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

      for (let x = 0, i = 1; x < size; x++) {
        for (let y = 0; y < size; y++, i++) {
          const upscaledPromise = upscale_jobs.get(i.toString())
          if (upscaledPromise) {
            const upscaled = await upscaledPromise
            ctx.drawImage(upscaled, 0, 0, imageSize, imageSize, y * imageSize, x * imageSize, imageSize, imageSize)
            ctx.strokeRect(y * imageSize, x * imageSize, imageSize, imageSize)
            // Close the upscaled bitmap to free memory
            upscaled.close()
          }
        }
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
      "forceUpscale"
    ])
  }
})
</script>
