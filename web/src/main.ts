import 'simplewebdesign'
import './style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import i18n, { initializeI18n } from './services/i18n.service'
import surrealdb from './services/surrealdb.service'
import cookieService, { CookieService } from './services/cookies.service'
import HomeView from './views/public/HomeView.vue'
import StopDetailsView from './views/public/StopDetailsView.vue'
import LoginView from './views/public/LoginView.vue'
import StudioHome from './views/studio/StudioHome.vue'
import StudioStopView from './views/studio/StudioStopView.vue'
import StudioOperatorView from './views/studio/StudioOperatorView.vue'
import StudioTypeView from './views/studio/StudioTypeView.vue'
import StudioUserView from './views/studio/StudioUserView.vue'
import StudioRoleView from './views/studio/StudioRoleView.vue'
import StudioRouteView from './views/studio/StudioRouteView.vue'
import StudioLineView from './views/studio/StudioLineView.vue'
import StudioJouneyView from './views/studio/StudioJouneyView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/login', name: 'login', component: LoginView },
        { path: '/stop/:id', name: 'stop', component: StopDetailsView },
        { path: '/studio', name: 'studio', component: StudioHome, beforeEnter: CookieService.auth },
        { path: '/studio/stop', name: 'studio_stop', component: StudioStopView, beforeEnter: CookieService.auth },
        { path: '/studio/operator', name: 'studio_operator', component: StudioOperatorView, beforeEnter: CookieService.auth },
        { path: '/studio/type', name: 'studio_type', component: StudioTypeView, beforeEnter: CookieService.auth },
        { path: '/studio/route', name: 'studio_route', component: StudioRouteView, beforeEnter: CookieService.auth },
        { path: '/studio/line', name: 'studio_line', component: StudioLineView, beforeEnter: CookieService.auth },
        { path: '/studio/journey', name: 'studio_yourney', component: StudioJouneyView, beforeEnter: CookieService.auth },
        { path: '/studio/role', name: 'studio_role', component: StudioRoleView, beforeEnter: CookieService.auth },
        { path: '/studio/user', name: 'studio_user', component: StudioUserView, beforeEnter: CookieService.auth }
    ],
})

await initializeI18n({
    languages: ['en', 'de'],
    fallback: 'en'
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(surrealdb)
app.use(cookieService)
app.mount('#app')
