<template>
<a href="#" @click.prevent="showSearch">
  <canvas v-if="image" ref="canvas" :title="title" />
  <ion-icon v-else class="is-size-1" name="images-outline" />
</a>
</template>

<script lang="ts">
import { ref, defineComponent, nextTick } from "vue"
import { useStore } from "vuex"
import { Update } from "../types"

export default defineComponent({
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    const store = useStore()
    const image = ref("")
    const title = ref("")
    const canvas = ref<HTMLCanvasElement|null>(null)

    const update = (update: Update) => {
      title.value = update.title
      const img = new Image()
      img.onload = () => {
        nextTick().then(() => {
          const c = (canvas.value as HTMLCanvasElement)
          c.width = 200
          c.height = 200
          const ctx = c.getContext("2d")
          ctx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, 200, 200)
        })
      }
      img.src = update.image
      image.value = update.image
      store.dispatch("updateCanvas", { id: props.id, image: update.image })
    }

    const showSearch = () => store.dispatch("showSearch", { id: props.id, updater: update })

    return { image, title, canvas, showSearch }
  }
})
</script>
