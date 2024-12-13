import './assets/swd/swd.min.css'
import './assets/swd/swd.min.js'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import surrealdb from './services/surrealdb.service'

const app = createApp(App)
app.use(router)
app.use(surrealdb)
app.mount('#app')
