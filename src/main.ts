import { createApp } from "vue"
import App from "./App.vue"
import store, { key } from "./store"
import "./styles.css"

createApp(App).use(store, key).mount("#app")
