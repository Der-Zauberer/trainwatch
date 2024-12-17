import { Surreal } from 'surrealdb';
import type { App } from 'vue';

const surrealdb = new Surreal();

try {
    await surrealdb.connect('ws://localhost:8080/rpc', {
        namespace: "pis.derzauberer.eu",
        database: "develop"
    });
} catch (error) {
    console.error(error)
}

export default {
    install(app: App) {
        app.config.globalProperties.$surrealdb = surrealdb;
        app.provide('surrealdb', surrealdb);
    }
};