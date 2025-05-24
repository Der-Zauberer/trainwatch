<template>
    <swd-card-outline class="grid-cols-1">

        <h3>Login</h3>

        <swd-loading-spinner loading="true" v-if="loading"></swd-loading-spinner>

        <form @submit="$event.preventDefault(); login()" v-if="!loading">

            <swd-input>
                <label for="login-username" >Username</label>
                <input id="login-username" type="text" v-model.lazy="credentials.username" :invalid="error">
            </swd-input>

            <swd-input>
                <label for="login-password">Password</label>
                <input id="login-password" type="password" v-model.lazy="credentials.password" :invalid="error">
            </swd-input>

            <p class="red-text">{{ error }}</p>

            <div class="flex flex-end margin-0">
                <input class="width-100" type="submit" value="Login">
            </div>

        </form>

    </swd-card-outline>
</template>

<style scoped>

swd-card-outline {
    max-width: 350px;
    margin: calc(var(--theme-element-spacing) * 2) auto;
    padding: var(--theme-element-spacing);
    border-radius: calc(var(--theme-border-radius) * 2);
    border-color: var(--theme-primary-color);
}

swd-loading-spinner {
    height: calc(3 * var(--theme-inner-element-spacing) + round(2.2em, 1px) + 2 * 58px) !important;
}

form { display: contents }
form * { margin: 0 }

@media only screen and (max-width: 575px) { swd-card-outline {
    border: 0;
}}

</style>

<script setup lang="ts">
import type { SurrealDbService } from '@/services/surrealdb.service';
import { SurrealDbError } from 'surrealdb';
import { inject, ref, reactive, toRaw } from 'vue';

const surrealdb = inject('surrealDbService') as SurrealDbService

const credentials = reactive({ username: '', password: '' })
const loading = ref<boolean>()
const error = ref<string>()

async function login() {
    loading.value = true
    try {
        await surrealdb.signinAndRedirect(toRaw(credentials), '/studio')
        loading.value = false
        error.value = undefined

    } catch (exception) {
        loading.value = false
        error.value = (exception as SurrealDbError).message
    }
}

</script>