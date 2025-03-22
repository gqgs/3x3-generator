<template>
<a href="#" 
   @click.prevent="showSearch"
   draggable="true"
   @dragstart="onDragStart"
   @dragover.prevent
   @drop="onDrop">
  <img v-if="currentImage" :src="currentImage" :title="title" />
  <span v-else class="icon-img icon is-medium">
    <ion-icon class="is-size-1" name="images-outline" />
  </span>
</a>
</template>

<style scoped>
span.icon-img {
  height: 100%;
}
</style>

<script lang="ts">
import { ref, computed, defineComponent } from "vue"
import { useStore } from "../store"
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
    const title = ref("")
    
    const currentImage = computed(() => {
      const img = store.state.images[props.id]
      return img ? img.url : ""
    })

    const update = (update: Update) => {
      title.value = update.title
      store.dispatch("updateImages", { 
        id: props.id, 
        image: update.image, 
        bitmap: update.bitmap 
      })
    }

    const showSearch = () => store.dispatch("showSearch", { id: props.id, updater: update })

    const onDragStart = (event: DragEvent) => {
      if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', props.id.toString());
      }
    }

    const onDrop = (event: DragEvent) => {
      if (event.dataTransfer) {
        const fromId = event.dataTransfer.getData('text/plain');
        store.commit('moveImage', { fromId, toId: props.id });
      }
    }

    return { 
      currentImage, 
      title, 
      showSearch,
      onDragStart,
      onDrop
    }
  }
})
</script>
