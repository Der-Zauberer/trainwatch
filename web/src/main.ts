import './assets/swd/swd.min.css'
import './assets/swd/swd.min.js'
import './assets/trainwatch/style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import surrealdb from './services/surrealdb.service'
import cookies from './services/cookies.service'
import HomeView from './views/HomeView.vue'
import StationView from './views/StationView.vue'
import LoginView from './views/LoginView.vue'
import TableView from './views/TableView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
        },
        {
            path: '/stations',
            name: 'station',
            component: StationView,
        },
        {
            path: '/table',
            name: 'table',
            component: TableView,
        }
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
