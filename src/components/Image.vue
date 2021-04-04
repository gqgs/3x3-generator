<template>
<a href="" @click.prevent="test">Select image</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    data() {
        return {

        };
    },
    methods: {
        test() {
            console.log("hello world");
        }
    }
})
</script>
