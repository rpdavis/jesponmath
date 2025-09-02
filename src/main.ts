import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupGuards } from './router/guards'

// Initialize Firebase
import './firebase/config'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Setup router guards after Pinia is initialized
setupGuards(router)

app.mount('#app')
