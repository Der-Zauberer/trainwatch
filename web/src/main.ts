import 'simplewebdesign'
import './assets/style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import surrealdb from './services/surrealdb.service'
import cookieService, { CookieService } from './services/cookies.service'
import HomeView from './views/public/HomeView.vue'
import StationView from './views/public/StationView.vue'
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
import { createI18n } from 'vue-i18n'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/login', name: 'login', component: LoginView },
        { path: '/stations', name: 'station', component: StationView },
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

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        en: {
            page: {
                home: 'Home',
                studio: 'Studio',
                dashboard: 'Dashboard',
                login: 'Login',
                logout: 'Logout'
            },
            action: {
                new: 'New',
                search: 'Search',
                delete: 'Delete',
                save: 'Save',
                cancel: 'Cancel'
            },
            entity: {
                general: {
                    id: 'Id',
                    name: 'Name',
                    description: 'Description'
                },
                vehicle: {
                    vehicle: 'Vehicle | Vehicles',
                    TRAIN: 'Train',
                    BUS: 'Bus',
                    SHIP: 'Ship',
                    PLANER: 'Plane'
                },
                classifictaion: {
                    classifictaion: 'Classifictaion | Classifictaions',
                    REGIONAL: 'Regional',
                    LONG_DISTANCE: 'Long-Distance'
                },
                location: {
                    location: 'Location | Locations',
                    latitude: 'Latitude',
                    longitude: 'Longitude'
                },
                address: {
                    address: 'Address | Addresses',
                    street: 'Street',
                    zipcode: 'Zipcode',
                    city: 'City',
                    federalState: 'Federal State',
                    country: 'Country'
                },
                source: {
                    source: 'Source | Sources',
                    license: 'License',
                    url: 'Url',
                    updated: 'Updated'
                },
                color: {
                    color: 'Color | Colors',
                    text: 'Text',
                    background: 'Background',
                },
                stop: {
                    stop: 'Stop | Stops',
                    score: 'Score',
                    platforms: {
                        platforms: 'Platforms',
                        length: 'Length',
                        height: 'Height',
                        linkedPlatforms: 'Linked Platforms'
                    },
                    open: {
                        open: 'Opening Hours',
                        monday: 'Monday',
                        tuesday: 'Tuesday',
                        wednesday: 'Wednesday',
                        thursday: 'Thursday',
                        friday: 'Friday',
                        saturday: 'Saturday',
                        sunday: 'Sunday'
                    },
                    services: {
                        services: 'Services',
                        parking: 'Parking',
                        localPublicTransport: 'Local Public Transport',
                        carRental: 'Car Rental',
                        taxi: 'Taxi',
                        publicFacilities: 'Public Facilities',
                        travelNecessities: 'Travel Necessities',
                        locker: 'Locker',
                        wifi: 'Wifi',
                        information: 'Information',
                        railwayMission: 'Railway Mission',
                        lostAndFound: 'Lost And Found',
                        barrierFree: 'BarrierFree',
                        mobilityService: 'MobilityService'
                    },
                    ids: {
                        ids: 'Ids',
                    }
                },
                type: {
                    type: 'Type | Types',
                    priority: 'Priority'
                },
                operator: {
                    operator: 'Operator | Operators',
                    website: 'Website'
                },
                route: {
                    route: 'Route | Routes',
                    designations: {
                        designations: 'Designations',
                        number: 'Number'
                    }
                },
                line: {
                    line: 'Line'
                },
                journey: {
                    journey: 'Journey'
                },
                role: {
                    role: 'Role | Roles',
                    permissions: 'Permissions'
                },
                user: {
                    user: 'User | Users',
                    email: 'Email',
                    username: 'Username',
                    password: 'Password',
                    permissions: 'Permissions'
                }
            }
        }
    }
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(surrealdb)
app.use(cookieService)
app.mount('#app')
