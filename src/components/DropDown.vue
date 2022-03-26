<template>
  <div>
    <div :class="{'is-active': active}" class="dropdown is-up">
        <div class="dropdown-trigger">
        <button class="button" aria-haspopup="true" :aria-controls="dropdown_menu_id" @click="active = !active" :disabled=disabled>
            <slot name="selected"></slot>
            <span class="icon is-small">
            <ion-icon name="chevron-down-outline"></ion-icon>
            </span>
        </button>
        </div>
        <div class="dropdown-menu" :id="dropdown_menu_id" role="menu">
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
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ["clicked"],
  setup () {
    const active = ref(false)
    const id = Math.random().toString().slice(-8)
    const dropdown_menu_id = `dropdown-menu-${id}`
    return {
      active,
      dropdown_menu_id
    }
  }
})
</script>
