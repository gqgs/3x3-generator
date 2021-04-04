<template>
<a href="#" @click.prevent="showSearch({id: id, imageSetter: setImage})">
  <img v-if="image" :src="image" />
  <span v-else>Select image</span>
</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

export default defineComponent({
  data () {
    return {
      image: ''
    }
  },
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  methods: {
    ...mapActions([
      'showSearch'
    ]),
    setImage (image: string) {
      this.image = image
    }
  }
})
</script>
