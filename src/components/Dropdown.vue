<template>
  <div>
    <div :class="{'is-active': active}" class="dropdown is-up">
        <div class="dropdown-trigger">
        <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" @click="active = !active">
            <slot name="selected"></slot>
            <span class="icon is-small">
            <ion-icon name="chevron-down-outline"></ion-icon>
            </span>
        </button>
        </div>
        <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">
            <a href="#" :key='option' v-for="option in options"
              @click.prevent="$emit('clicked', option); active = false" class="dropdown-item">
            <slot name="option" :option="option"></slot>
            </a>
        </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
button {
  font-size: 13px;
}
</style>

<script lang="ts">
import { ref, defineComponent } from "vue"

export default defineComponent({
  props: {
    options: {
      type: Array,
      required: true
    }
  },
  emits: ["clicked"],
  setup () {
    const active = ref(false)
    return {
      active
    }
  }
})
</script>
