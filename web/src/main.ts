import 'simplewebdesign'
import './style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import i18n, { initializeI18n } from './services/i18n.service'
import surrealdbService, { auth } from './services/surrealdb.service'
import HomeView from './views/public/HomeView.vue'
import LoginView from './views/public/LoginView.vue'
import StopDetailsView from './views/public/StopDetailsView.vue'
import LineDetailsView from './views/public/LineDetailsView.vue'
import StudioHome from './views/studio/StudioHome.vue'
import StudioStopView from './views/studio/StudioStopView.vue'
import StudioOperatorView from './views/studio/StudioOperatorView.vue'
import StudioTypeView from './views/studio/StudioTypeView.vue'
import StudioUserView from './views/studio/StudioUserView.vue'
import StudioRoleView from './views/studio/StudioRoleView.vue'
import StudioRouteView from './views/studio/StudioRouteView.vue'
import StudioLineView from './views/studio/StudioLineView.vue'
import StudioJouneyView from './views/studio/StudioJouneyView.vue'
import StudioTimetableView from './views/studio/StudioTimetableView.vue'
import JourneyDetailsVue from './views/public/JourneyDetailsVue.vue'
import ProfileView from './views/public/ProfileView.vue'
import dbTimetableService from './services/db-timetable.service'
import StudioInformation from './views/studio/StudioInformation.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/login', name: 'login', component: LoginView },
        { path: '/profile', name: 'profile', component: ProfileView, beforeEnter: auth() },
        { path: '/stop', name: 'stop', component: StopDetailsView },
        { path: '/stop/:id', name: 'stop-details', component: StopDetailsView },
        { path: '/line/:id', name: 'line', component: LineDetailsView },
        { path: '/journey/:id', name: 'journey', component: JourneyDetailsVue },
        { path: '/studio', name: 'studio', component: StudioHome, beforeEnter: auth() },
        { path: '/studio/stop', name: 'studio_stop', component: StudioStopView, beforeEnter: auth() },
        { path: '/studio/stop/:id', name: 'studio_stop_edit', component: StudioStopView, beforeEnter: auth() },
        { path: '/studio/operator', name: 'studio_operator', component: StudioOperatorView, beforeEnter: auth() },
        { path: '/studio/operator/:id', name: 'studio_operator_edit', component: StudioOperatorView, beforeEnter: auth() },
        { path: '/studio/type', name: 'studio_type', component: StudioTypeView, beforeEnter: auth() },
        { path: '/studio/type/:id', name: 'studio_type_edit', component: StudioTypeView, beforeEnter: auth() },
        { path: '/studio/timetable', name: 'studio_timetable', component: StudioTimetableView, beforeEnter: auth() },
        { path: '/studio/timetable/:id', name: 'studio_timetable_edit', component: StudioTimetableView, beforeEnter: auth() },
        { path: '/studio/route', name: 'studio_route', component: StudioRouteView, beforeEnter: auth() },
        { path: '/studio/route/:id', name: 'studio_route_edit', component: StudioRouteView, beforeEnter: auth() },
        { path: '/studio/line', name: 'studio_line', component: StudioLineView, beforeEnter: auth() },
        { path: '/studio/line/:id', name: 'studio_line_edit', component: StudioLineView, beforeEnter: auth() },
        { path: '/studio/journey', name: 'studio_journey', component: StudioJouneyView, beforeEnter: auth() },
        { path: '/studio/journey/:id', name: 'studio_journey_edit', component: StudioJouneyView, beforeEnter: auth() },
        { path: '/studio/information', name: 'studio_information', component: StudioInformation, beforeEnter: auth() },
        { path: '/studio/information/:id', name: 'studio_information_edit', component: StudioInformation, beforeEnter: auth() },
        { path: '/studio/role', name: 'studio_role', component: StudioRoleView, beforeEnter: auth() },
        { path: '/studio/role/:id', name: 'studio_role_edit', component: StudioRoleView, beforeEnter: auth() },
        { path: '/studio/user', name: 'studio_user', component: StudioUserView, beforeEnter: auth() },
        { path: '/studio/user/:id', name: 'studio_user_edit', component: StudioUserView, beforeEnter: auth() }
    ],
})

;(async () => {

    await initializeI18n({
        languages: ['en', 'de'],
        fallback: 'en'
    })

    const app = createApp(App)
    app.use(router)
    app.use(i18n)
    app.use(surrealdbService)
    app.use(dbTimetableService)
    app.mount('#app')

})()