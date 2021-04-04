<template>
<a href="" @click.prevent="search">Select image</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    return {

    }
  },
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  methods: {
    search () {
      console.log('search image', this.id)
    }
  }
})
</script>
