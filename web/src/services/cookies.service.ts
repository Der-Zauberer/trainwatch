import type Surreal from "surrealdb";
import { type App } from "vue";

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
        return this.payload.exp < new Date().getTime()
    }
}

export class CookieService {

    readonly surrealdb: Surreal
    readonly cookies: Map<string, string> = new Map()
    readonly TOKEN_COOKIE = 'token'

    token?: JwtToken

    constructor(surrealdb: Surreal) {
        this.surrealdb = surrealdb
        for (const cookie of document.cookie.split('; ')) {
            const [name, value] = cookie.split('=');
            this.cookies.set(name, decodeURIComponent(value || ''));
        }
        const token = this.cookies.get(this.TOKEN_COOKIE)
        if (token) {
            this.token = new JwtToken(token)
        }
    }

    setCookie(name: string, value: string, date: Date) {
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Strict`
        this.cookies.set(name, value)
        if (this.TOKEN_COOKIE) this.token = new JwtToken(value)
    }

    getCookie(name: string): string | undefined {
        return this.cookies.get(name)
    }

    deleteCookie(name: string) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
        this.cookies.delete(name)
        if (this.TOKEN_COOKIE) this.token = undefined
    }

    async login(credentials: { username: string, password: string }): Promise<JwtToken> {
        const token = new JwtToken(await this.surrealdb.signin(credentials))
        this.setCookie(this.TOKEN_COOKIE, token.raw, new Date(token.payload.exp))
        return token;
    }

    async logout() {
        await this.surrealdb.invalidate()
        this.deleteCookie(this.TOKEN_COOKIE)
    }

    async authenticate(): Promise<boolean> {
        if (!this.token || this.token.isExpired()) {
            this.cookies.delete(this.TOKEN_COOKIE)
            return false
        }
        return await this.surrealdb.authenticate(this.token.raw)
    }

    isAuthenticated(): boolean {
        return !!this.token
    }

}

export default {
    install(app: App) {
        const surrealdb = app.config.globalProperties.$surrealdb
        const cookies = new CookieService(surrealdb)
        app.config.globalProperties.$surrealdb = cookies;
        app.provide('cookies', cookies);
    }
}