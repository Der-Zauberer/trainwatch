import { ConnectionStatus, Surreal } from 'surrealdb';
import type { App } from 'vue';

const surrealdb = new Proxy(new Surreal(), {
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
            }
            return (original as T).apply(target, args)
        }
    },
})

export default {
    install(app: App) {
        app.config.globalProperties.$surrealdb = surrealdb
        app.provide('surrealdb', surrealdb)
    }
}