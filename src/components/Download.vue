<template>
    <div :class="{'is-active': active}" class="dropdown">
    <div class="dropdown-trigger">
      <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" @click="toggle">
        <span>Download image</span>
        <span class="icon is-small">
          <ion-icon name="chevron-down-outline"></ion-icon>
        </span>
      </button>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu">
      <div class="dropdown-content">
        <a href="#" :key='mime' v-for="mime in ['image/jpeg', 'image/png', 'image/webp']" @click.prevent="download(mime)" class="dropdown-item">
          Download ({{mime}})
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'vuex'
import fileDownload from 'js-file-download'

export default defineComponent({
  mounted () {
    this.canvas.width = 600
    this.canvas.height = 600
  },
  data () {
    return {
      active: false
    }
  },
  computed: {
    ...mapState([
      'canvas'
    ])
  },
  methods: {
    ...mapActions([
      'hideSearch'
    ]),
    toggle () {
      this.active = !this.active
      if (this.active) {
        this.hideSearch()
      }
    },
    download (mimeType: string) {
      (this.canvas as HTMLCanvasElement).toBlob(blob => {
        if (blob == null) return
        let filename: string
        switch (mimeType) {
          case 'image/png':
            filename = '3x3gen.png'
            break
          case 'image/webp':
            filename = '3x3gen.webp'
            break
          default:
            filename = '3x3gen.jpg'
        }
        fileDownload(blob, filename)
        this.active = false
      }, mimeType)
    }
  }
})
</script>
