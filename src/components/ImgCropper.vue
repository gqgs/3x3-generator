<template>
  <img
    v-if="showImage"
    @click="handlePrimaryAction"
    :src="thumbnailSrc"
    :title="result.title"
    class="image-result h-36 w-36 min-w-36 cursor-pointer rounded-2xl object-cover shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-blue-300 sm:h-40 sm:w-40 sm:min-w-40"
  />
  <img :src="thumbnailSrc" @load="onImageLoaded" style="display: none;">

  <CropperModal
    :open="isOpen"
    :result="result"
    @applied="applyUpdate"
    @closed="closeCropper"
  />
</template>

<script lang="ts">
import { ref, defineComponent, PropType, computed } from "vue"
import { useStore } from "../store"
import { SearchResult, Update } from "../types"
import CropperModal from "./CropperModal.vue"

export default defineComponent({
  components: {
    CropperModal
  },
  props: {
    result: {
      required: true,
      type: Object as PropType<SearchResult>
    },
    clickAction: {
      type: String as PropType<"crop" | "show-more">,
      default: "crop"
    }
  },
  emits: ["selected", "show-more"],
  setup (props, { emit }) {
    const store = useStore()
    const showImage = ref(false)
    const isOpen = ref(false)

    const thumbnailSrc = computed(() => props.result.image_url)

    const onImageLoaded = () => {
      showImage.value = true
    }

    const openCropper = () => {
      isOpen.value = true
    }

    const handlePrimaryAction = () => {
      if (props.clickAction === "show-more") {
        emit("show-more", props.result)
        return
      }
      openCropper()
    }

    const closeCropper = () => {
      isOpen.value = false
    }

    const applyUpdate = (update: Update) => {
      store.dispatch("updateCell", update)
      emit("selected", props.result)
      store.dispatch("hideSearch")
      closeCropper()
    }

    return {
      showImage,
      onImageLoaded,
      handlePrimaryAction,
      isOpen,
      closeCropper,
      applyUpdate,
      thumbnailSrc
    }
  }
})
</script>
