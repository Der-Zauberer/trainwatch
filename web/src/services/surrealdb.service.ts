import { Surreal } from 'surrealdb';
import type { App } from 'vue';

const surrealdb = new Surreal()

try {
    await surrealdb.connect(import.meta.env.VITE_SURREALDB_ADDRESS, {
        namespace: import.meta.env.VITE_SURREALDB_NAMESPACE,
        database: import.meta.env.VITE_SURREALDB_DATABASE
    })
} catch (error) {
    console.error(error)
}

export default {
    install(app: App) {
        app.config.globalProperties.$surrealdb = surrealdb
        app.provide('surrealdb', surrealdb)
    }
}