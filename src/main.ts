import './assets/main.css'
import 'katex/dist/katex.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupGuards } from './router/guards'

// Initialize Firebase
import './firebase/config'

console.log('🚀 APP STARTING - Window location:', window.location.href)
console.log('🚀 APP STARTING - Window pathname:', window.location.pathname)
console.log('🚀 APP STARTING - Window search:', window.location.search)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Setup router guards after Pinia is initialized
setupGuards(router)

console.log('🚀 APP MOUNTING - About to mount Vue app')
app.mount('#app')
console.log('🚀 APP MOUNTED - Vue app mounted')