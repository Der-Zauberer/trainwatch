<template>
    <swd-card-outline class="grid-cols-1">

        <h3>Login</h3>

        <form @submit="$event.preventDefault(); login()">

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

form { display: contents }
form * { margin: 0 }

@media only screen and (max-width: 575px) { swd-card-outline {
    border: 0;
}}

</style>

<script setup lang="ts">
import type { CookieService } from '@/services/cookies.service';
import { SurrealDbError } from 'surrealdb';
import { inject, ref, reactive, toRaw } from 'vue';

const cookies = inject('cookieService') as CookieService

const credentials = reactive({ username: '', password: '' })
const error = ref()

async function login() {
    try {
        await cookies.loginAndRedirect(toRaw(credentials), '/studio')
        error.value = undefined

    } catch (exception) {
        error.value = (exception as SurrealDbError).message
    }
}

</script>