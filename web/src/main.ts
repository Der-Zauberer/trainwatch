import './assets/swd/swd.min.css'
import './assets/swd/swd.min.js'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
