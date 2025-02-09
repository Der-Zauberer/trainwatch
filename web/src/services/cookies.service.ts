import type Surreal from "surrealdb";
import { computed, ref, type App, type Ref } from "vue";
import { type NavigationGuardNext, type RouteLocationNormalized, type Router } from "vue-router";

export class JwtToken {
    header: {
        typ: string,
        alg: string
    }
    payload: {
        iat: number,
        nbf: number,
        exp: number,
        iss: string,
        jit: string,
        ID: string,
    }
    signature: string
    raw: string

    constructor(token: string) {
        const [header, payload, signature] = token.split('.')
        this.header = JSON.parse(atob(header))
        this.payload = JSON.parse(atob(payload))
        this.signature = signature
        this.raw = token
    }

    isExpired():boolean {
        return this.payload.exp * 1000 < new Date().getTime()
    }
}

export class CookieService {

    private readonly router: Router
    private readonly surrealdb: Surreal
    private readonly cookies: Map<string, string> = new Map()
    readonly TOKEN_COOKIE = 'token'

    private loginRedirect?: RouteLocationNormalized
    private token: Ref<JwtToken | undefined> = ref()

    constructor(router: Router, surrealdb: Surreal) {
        this.router = router
        this.surrealdb = surrealdb
        for (const cookie of document.cookie.split('; ')) {
            const [name, value] = cookie.split('=');
            this.cookies.set(name, decodeURIComponent(value || ''));
        }
        const token = this.cookies.get(this.TOKEN_COOKIE)
        if (token) this.token.value = new JwtToken(token)
    }

    setCookie(name: string, value: string, date: Date) {
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Strict`
        this.cookies.set(name, value)
        if (this.TOKEN_COOKIE) this.token.value = new JwtToken(value)
    }

    getCookie(name: string): string | undefined {
        return this.cookies.get(name)
    }

    deleteCookie(name: string) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
        this.cookies.delete(name)
        if (this.TOKEN_COOKIE) this.token.value = undefined
    }

    async login(credentials: { username: string, password: string }): Promise<JwtToken> {
        const token = new JwtToken(await this.surrealdb.signin(credentials))
        this.token.value = token
        this.setCookie(this.TOKEN_COOKIE, token.raw, new Date(token.payload.exp * 1000))
        return token;
    }

    async loginAndredirect(credentials: { username: string, password: string }, defaultRoute: string | RouteLocationNormalized = '/') {
        await this.login(credentials)
        this.router.replace(this.loginRedirect || defaultRoute)
        this.loginRedirect = undefined
    }

    async logout() {
        await this.surrealdb.invalidate()
        this.token.value = undefined
        this.deleteCookie(this.TOKEN_COOKIE)
    }

    async logoutAndRedirect(route: string | RouteLocationNormalized = '/') {
        await this.logout()
        this.router.replace(route)
    }

    async authenticate(): Promise<boolean> {
        if (!this.token.value || this.token.value.isExpired()) {
            this.cookies.delete(this.TOKEN_COOKIE)
            return false
        }
        return await this.surrealdb.authenticate(this.token.value.raw)
    }

    isAuthenticated(): boolean {
        return !!this.token.value
    }

    getToken(): JwtToken | undefined {
        return this.token.value
    }

    isAuthenticatedAsRef(): Ref<boolean> {
        return computed(() => !!this.token.value)
    }

    getTokenAsRef(): Ref<JwtToken | undefined> {
        return this.token
    }

    before = (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
        if (!this.isAuthenticated() && to.path !== '/login') {
            this.loginRedirect = to
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
        const cookies = new CookieService(router, surrealdb)
        app.config.globalProperties.$surrealdb = cookies;
        app.provide('cookies', cookies);
    }
}