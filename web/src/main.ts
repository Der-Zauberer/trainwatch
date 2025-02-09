import 'simplewebdesign'
import './assets/style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import surrealdb from './services/surrealdb.service'
import cookies from './services/cookies.service'
import HomeView from './views/public/HomeView.vue'
import StationView from './views/public/StationView.vue'
import LoginView from './views/public/LoginView.vue'
import TableView from './views/studio/TableView.vue'
import StudioHome from './views/studio/StudioHome.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/login', name: 'login', component: LoginView },
        { path: '/stations', name: 'station', component: StationView },
        { path: '/studio', name: 'studio', component: StudioHome },
        { path: '/table', name: 'table', component: TableView }
    ],
})

// @ts-expect-error define language
window.swd.configureLanguages({
    languages: [
        { locale: 'en', src: '/i18n/en.properties' },
        { locale: 'de', src: '/i18n/de.properties' }
    ],
    fallback: 'en'
})
// @ts-expect-error set default language
await window.swd.setLanguage(navigator.language)

const app = createApp(App)
app.use(router)
app.use(surrealdb)
app.use(cookies)
app.mount('#app')
