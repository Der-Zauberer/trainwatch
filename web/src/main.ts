import 'simplewebdesign'
import './assets/style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import surrealdb from './services/surrealdb.service'
import cookies, { CookieService } from './services/cookies.service'
import HomeView from './views/public/HomeView.vue'
import StationView from './views/public/StationView.vue'
import LoginView from './views/public/LoginView.vue'
import StudioHome from './views/studio/StudioHome.vue'
import StudioStopListView from './views/studio/StudioStopListView.vue'
import StudioOperatorListView from './views/studio/StudioOperatorListView.vue'
import StudioTypeListView from './views/studio/StudioTypeListView.vue'
import StudioUserListView from './views/studio/StudioUserListView.vue'
import StudioRoleListView from './views/studio/StudioRoleListView.vue'
import StudioRouteListView from './views/studio/StudioRouteListView.vue'
import StudioLineListView from './views/studio/StudioLineListView.vue'
import StudioJouneyListView from './views/studio/StudioJouneyListView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/login', name: 'login', component: LoginView },
        { path: '/stations', name: 'station', component: StationView },
        { path: '/studio', name: 'studio', component: StudioHome, beforeEnter: CookieService.auth },
        { path: '/studio/stop', name: 'studio_stop', component: StudioStopListView, beforeEnter: CookieService.auth },
        { path: '/studio/operator', name: 'studio_operator', component: StudioOperatorListView, beforeEnter: CookieService.auth },
        { path: '/studio/type', name: 'studio_type', component: StudioTypeListView, beforeEnter: CookieService.auth },
        { path: '/studio/route', name: 'studio_route', component: StudioRouteListView, beforeEnter: CookieService.auth },
        { path: '/studio/line', name: 'studio_line', component: StudioLineListView, beforeEnter: CookieService.auth },
        { path: '/studio/journey', name: 'studio_yourney', component: StudioJouneyListView, beforeEnter: CookieService.auth },
        { path: '/studio/role', name: 'studio_role', component: StudioRoleListView, beforeEnter: CookieService.auth },
        { path: '/studio/user', name: 'studio_user', component: StudioUserListView, beforeEnter: CookieService.auth }
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
