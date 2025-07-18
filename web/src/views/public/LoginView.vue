<template>
    <swd-card-outline class="grid-cols-1">

        <h3>Login</h3>

        <swd-loading-spinner loading="true" v-if="loading"></swd-loading-spinner>

        <form @submit.prevent="login()" v-if="!loading && !change">

            <swd-input>
                <label for="login-username">Username</label>
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

        <form @submit.prevent="changePassword()" v-if="!loading && change">

            <swd-input>
                <label for="old-password">Old Password</label>
                <input id="old-password" type="password" v-model.lazy="change.old" :invalid="error">
            </swd-input>

            <swd-input>
                <label for="new-password">New Password</label>
                <input id="new-password" type="password" v-model.lazy="change.new" :invalid="error">
            </swd-input>

            <swd-input>
                <label for="repeat-password">Repeat Password</label>
                <input id="repeat-password" type="password" v-model.lazy="change.new2" :invalid="error">
            </swd-input>
                
            <p class="red-text">{{ error }}</p>

            <div class="flex flex-end margin-0">
                <input class="width-100" type="submit" value="Change Password">
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
import { parseCustomSurrealDbError } from '@/core/functions';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { inject, ref, reactive, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';

const surrealdb = inject('surrealDbService') as SurrealDbService
const { t } = useI18n();

const credentials = reactive({ username: '', password: '' })
const change = ref<{ username: string, old: string, new: string, new2: string } | undefined>()
const loading = ref<boolean>()
const error = ref<string>()

async function login() {
    loading.value = true
    try {
        await surrealdb.signinAndRedirect(toRaw(credentials), '/studio')
        error.value = undefined
    } catch (exception) {
        const dbError = parseCustomSurrealDbError(exception)
        if (dbError.success && dbError.key === 'error.user.password.change.required') {
            change.value = { username: credentials.username, old: '', new: '', new2: '' }
        }
        error.value = dbError.success ? t(dbError.key) : dbError.key
    } finally {
        loading.value = false
    }
}

async function changePassword() {
    loading.value = true
    try {
        await surrealdb.insert('password_change_request', change.value)
        if (change.value?.new) credentials.password = change.value?.new
        change.value = undefined
        await surrealdb.signinAndRedirect(toRaw(credentials), '/studio')
    } catch (exception) {
        const dbError = parseCustomSurrealDbError(exception)
        error.value = dbError.success ? t(dbError.key) : dbError.key
    } finally {
        loading.value = false
    }
}

</script>