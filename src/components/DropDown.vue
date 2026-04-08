<template>
  <div class="relative" @click.stop @keydown.esc="active = false">
    <button
      class="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-slate-100/75 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100/80 disabled:text-slate-400"
      aria-haspopup="true"
      :aria-controls="dropdown_menu_id"
      @click.stop="active = !active"
      :disabled="disabled"
      type="button"
    >
      <span class="truncate">
        <slot name="selected"></slot>
      </span>
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
        <ion-icon name="chevron-down-outline"></ion-icon>
      </span>
    </button>
    <div
      v-if="active"
      class="absolute bottom-[calc(100%+0.75rem)] left-0 z-30 w-full overflow-hidden rounded-2xl border border-white/75 bg-white/92 p-2 shadow-[0_20px_40px_rgba(148,163,184,0.28)] ring-1 ring-slate-200/70 backdrop-blur"
      :id="dropdown_menu_id"
      role="menu"
    >
      <a
        v-for="option in options"
        :key="option"
        href="#"
        class="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/90 hover:text-slate-900"
        @click.prevent="$emit('clicked', option); active = false"
      >
        <slot name="option" :option="option"></slot>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, PropType, onBeforeUnmount, onMounted } from "vue"

export default defineComponent({
  props: {
    options: {
      type: Array as PropType<string[]>,
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
    const onWindowClick = () => {
      active.value = false
    }

    onMounted(() => window.addEventListener("click", onWindowClick))
    onBeforeUnmount(() => window.removeEventListener("click", onWindowClick))

    return {
      active,
      dropdown_menu_id
    }
  }
})
</script>
