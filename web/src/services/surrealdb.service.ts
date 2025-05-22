import { Cookies } from '@/core/cookies';
import { JwtToken } from '@/core/jwt';
import type { User } from '@/core/types';
import { ConnectionStatus, Surreal, type RootAuth, type Token } from 'surrealdb';
import { ref, type App, type Ref } from 'vue';
import type { NavigationGuardNext, RouteLocationNormalized, Router } from 'vue-router';

const TOKEN_COOKIE = 'token'
const cookies = new Cookies()
let token = loadToken()
let loginRedirect: RouteLocationNormalized | undefined

export class SurrealDbService extends Surreal {

    private user: Ref<User | undefined> = ref()

    constructor(private router: Router) {
        super()
    }

    async signin(credentials: RootAuth): Promise<Token> {
        const jwt = new JwtToken(await super.signin({
            namespace: import.meta.env.VITE_SURREALDB_NAMESPACE,
            database: import.meta.env.VITE_SURREALDB_DATABASE,
            access: 'user',
            variables: credentials
        }))
        this.user.value = await super.info<User>()
        token = jwt
        cookies.set(TOKEN_COOKIE, jwt.raw, new Date((jwt.payload.exp || 0) * 1000))
        return jwt.raw
    }

    async signinAndRedirect(credentials: RootAuth, defaultRoute: string | RouteLocationNormalized = '/') {
        await this.signin(credentials)
        this.router.push(loginRedirect || defaultRoute)
        loginRedirect = undefined
    }

    async invalidate(): Promise<true> {
        this.user.value = undefined
        token = undefined
        cookies.delete(TOKEN_COOKIE)
        return await super.invalidate()
    }

    async invalidateAndRedirect(route: string | RouteLocationNormalized = '/') {
        await this.invalidate()
        this.router.push(route)
    }

    async authenticate(): Promise<true> {
        if (!token) return true
        const success = await super.authenticate(token.raw)
        if (success) {
            this.user.value = await super.info<User>()
        } else {
            token = undefined
            cookies.delete(TOKEN_COOKIE)
        }
        return success
    }

    getUser(): User | undefined {
        return this.user.value
    }
    
    getUserAsRef(): Ref<User | undefined> {
        return this.user
    }

}

function loadToken(): JwtToken | undefined {
    const token = cookies.get(TOKEN_COOKIE)
    if (!token) return undefined
    const jwt = new JwtToken(token)
    if (jwt.isExpired()) {
        cookies.delete(TOKEN_COOKIE)
        return undefined
    }
    return jwt
}

function addSurrealInitializer(SurrealDbService: SurrealDbService): SurrealDbService {
    return new Proxy(SurrealDbService, {
        get(target, property) {
            const original = target[property as keyof Surreal]
            if (typeof original !== "function") {
                return original
            }
            return async <T extends (...args: unknown[]) => unknown>(...args: Parameters<T>) => {
                if (original !== target.connect && (target.status === ConnectionStatus.Disconnected || target.status === ConnectionStatus.Error)) {
                    await target.connect(import.meta.env.VITE_SURREALDB_ADDRESS, {
                        namespace: import.meta.env.VITE_SURREALDB_NAMESPACE,
                        database: import.meta.env.VITE_SURREALDB_DATABASE
                    })
                    await target.ready
                    await target.authenticate()
                }
                return (original as T).apply(target, args)
            }
        },
    })
}

export function auth(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) {
    if (!token && to.path !== '/login') {
        loginRedirect = to
        next('/login')
    } else {
        next()
    }
}

export default {
    install(app: App) {
        const router = app.config.globalProperties.$router
        const surrealDbService = addSurrealInitializer(new SurrealDbService(router)) 
        app.config.globalProperties.$surrealDbService = surrealDbService
        app.provide('surrealDbService', surrealDbService)
    }
}