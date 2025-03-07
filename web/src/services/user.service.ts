import type Surreal from "surrealdb";
import type { CookieService, JwtToken } from "./cookies.service"
import { ref, watch, type App, type Ref } from "vue";
import type { User } from "@/core/types";
import { StringRecordId } from "surrealdb";

export class UserService {

    private user = ref<User | undefined>(undefined)

    constructor(private cookieService: CookieService, private surrealdb: Surreal) {
        this.reloadUser(cookieService.getToken())
        watch(this.cookieService.getTokenAsRef(), (token) => this.reloadUser(token))
    }

    private async reloadUser(token: JwtToken | undefined) {
        this.user.value = token?.payload.ID ? await this.surrealdb.select<User>(new StringRecordId(token?.payload.ID)) : undefined
    }

    getUser(): User | undefined {
        return this.user.value
    }

    getUserAsRef(): Ref<User | undefined> {
        return this.user
    }
    
}

export default {
    install(app: App) {
        const surrealdb = app.config.globalProperties.$surrealdb
        const cookieService = app.config.globalProperties.$cookieService
        const userService = new UserService(cookieService, surrealdb)
        app.config.globalProperties.$userService = userService
        app.provide('userService', userService)
    }
}