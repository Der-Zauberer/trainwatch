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

    private static readonly TOKEN_COOKIE = 'token'
    private static readonly cookies: Map<string, string> = new Map()
    private static loginRedirect?: RouteLocationNormalized
    private static token: Ref<JwtToken | undefined> = ref()

    private readonly router: Router
    private readonly surrealdb: Surreal

    static {
        for (const cookie of document.cookie.split('; ')) {
            const [name, value] = cookie.split('=');
            CookieService.cookies.set(name, decodeURIComponent(value || ''));
        }
        const token = CookieService.cookies.get(CookieService.TOKEN_COOKIE)
        if (token) CookieService.token.value = new JwtToken(token)
    }

    constructor(router: Router, surrealdb: Surreal) {
        this.router = router
        this.surrealdb = surrealdb
    }

    setCookie(name: string, value: string, date: Date) {
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Strict`
        CookieService.cookies.set(name, value)
        if (CookieService.TOKEN_COOKIE) CookieService.token.value = new JwtToken(value)
    }

    getCookie(name: string): string | undefined {
        return CookieService.cookies.get(name)
    }

    deleteCookie(name: string) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
        CookieService.cookies.delete(name)
        if (CookieService.TOKEN_COOKIE) CookieService.token.value = undefined
    }

    async login(credentials: { username: string, password: string }): Promise<JwtToken> {
        const token = new JwtToken(await this.surrealdb.signin(credentials))
        CookieService.token.value = token
        this.setCookie(CookieService.TOKEN_COOKIE, token.raw, new Date(token.payload.exp * 1000))
        return token;
    }

    async loginAndredirect(credentials: { username: string, password: string }, defaultRoute: string | RouteLocationNormalized = '/') {
        await this.login(credentials)
        this.router.replace(CookieService.loginRedirect || defaultRoute)
        CookieService.loginRedirect = undefined
    }

    async logout() {
        await this.surrealdb.invalidate()
        CookieService.token.value = undefined
        this.deleteCookie(CookieService.TOKEN_COOKIE)
    }

    async logoutAndRedirect(route: string | RouteLocationNormalized = '/') {
        await this.logout()
        this.router.replace(route)
    }

    async authenticate(): Promise<boolean> {
        if (!CookieService.token.value || CookieService.token.value.isExpired()) {
            CookieService.cookies.delete(CookieService.TOKEN_COOKIE)
            return false
        }
        return await this.surrealdb.authenticate(CookieService.token.value.raw)
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
        const cookies = new CookieService(router, surrealdb)
        cookies.authenticate()
        app.config.globalProperties.$surrealdb = cookies;
        app.provide('cookies', cookies);
    }
}