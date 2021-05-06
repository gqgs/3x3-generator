<template>
<a href="#" @click.prevent="showSearch">
  <img v-if="image" :src="image" :title="title" />
  <span v-else class="icon is-medium">
    <ion-icon class="is-size-1" name="images-outline" />
  </span>
</a>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue"
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

    const update = (update: Update) => {
      title.value = update.title
      image.value = update.image
      store.dispatch("updateCanvas", { id: props.id, image: update.image })
    }

    const showSearch = () => store.dispatch("showSearch", { id: props.id, updater: update })

    return { image, title, showSearch }
  }
})
</script>
