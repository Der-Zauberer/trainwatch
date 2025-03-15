import { Cookies } from "@/core/cookies";
import { JwtToken } from "@/core/jwt";
import type { User } from "@/core/types";
import type Surreal from "surrealdb";
import { computed, ref, type App, type Ref } from "vue";
import { type NavigationGuardNext, type RouteLocationNormalized, type Router } from "vue-router";

export class CookieService {

    private static readonly TOKEN_COOKIE = 'token'
    private static readonly cookies = new Cookies()
    private static loginRedirect?: RouteLocationNormalized
    private static token: Ref<JwtToken | undefined> = ref()
    private user: Ref<User | undefined> = ref()

    static {
        const token = CookieService.cookies.get(CookieService.TOKEN_COOKIE)
        if (token) CookieService.token.value = new JwtToken(token)
    }

    constructor(private router: Router, private surrealdb: Surreal) {}

    setCookie(name: string, value: string, date: Date) {
        CookieService.cookies.set(name, value, date)
        if (CookieService.TOKEN_COOKIE === name) CookieService.token.value = new JwtToken(value)
    }

    getCookie(name: string): string | undefined {
        return CookieService.cookies.get(name)
    }

    deleteCookie(name: string) {
        CookieService.cookies.delete(name)
        if (CookieService.TOKEN_COOKIE === name) CookieService.token.value = undefined
    }

    async login(credentials: { username: string, password: string }): Promise<JwtToken> {
        const token = new JwtToken(await this.surrealdb.signin({
            namespace: import.meta.env.VITE_SURREALDB_NAMESPACE,
            database: import.meta.env.VITE_SURREALDB_DATABASE,
            access: 'user',
            variables: credentials
        }))
        CookieService.token.value = token
        this.user.value = await this.surrealdb.info() as User | undefined
        this.setCookie(CookieService.TOKEN_COOKIE, token.raw, new Date((token.payload.exp || 0) * 1000))
        return token;
    }

    async loginAndRedirect(credentials: { username: string, password: string }, defaultRoute: string | RouteLocationNormalized = '/') {
        await this.login(credentials)
        this.router.replace(CookieService.loginRedirect || defaultRoute)
        CookieService.loginRedirect = undefined
    }

    async logout() {
        await this.surrealdb.invalidate()
        CookieService.token.value = undefined
        this.user.value = undefined
        this.deleteCookie(CookieService.TOKEN_COOKIE)
    }

    async logoutAndRedirect(route: string | RouteLocationNormalized = '/') {
        await this.logout()
        this.router.replace(route)
    }

    async authenticate(): Promise<boolean> {
        if (!CookieService.token.value || CookieService.token.value.isExpired()) {
            this.deleteCookie(CookieService.TOKEN_COOKIE)
            return false
        }
        const success = await this.surrealdb.authenticate(CookieService.token.value.raw)
        if (success) {
            this.user.value = await this.surrealdb.info() as User | undefined
        } else {
            this.deleteCookie(CookieService.TOKEN_COOKIE)
        }
        return success
    }

    isAuthenticated(): boolean {
        return !!CookieService.token.value
    }

    getToken(): JwtToken | undefined {
        return CookieService.token.value
    }

    isAuthenticatedAsRef(): Ref<boolean> {
        return computed(() => !!CookieService.token.value)
    }

    getTokenAsRef(): Ref<JwtToken | undefined> {
        return CookieService.token
    }

    getUser(): User | undefined {
        return this.user.value
    }
    
    getUserAsRef(): Ref<User | undefined> {
        return this.user
    }

    static auth = (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
        if (!CookieService.token.value && to.path !== '/login') {
            CookieService.loginRedirect = to
            next('/login')
        } else {
            next()
        }
    }

}

export default {
    install(app: App) {
        const router = app.config.globalProperties.$router
        const surrealdb = app.config.globalProperties.$surrealdb
        const cookieService = new CookieService(router, surrealdb)
        cookieService.authenticate()
        app.config.globalProperties.$cookieService = cookieService
        app.provide('cookieService', cookieService)
    }
}