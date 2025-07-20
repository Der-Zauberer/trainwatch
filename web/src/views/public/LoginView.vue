<template>
    <swd-card-outline class="grid-cols-1">

        <h3>{{ t('action.login') }}</h3>

        <swd-loading-spinner loading="true" v-if="loading"></swd-loading-spinner>

        <form @submit.prevent="login()" v-if="!loading && !change">

            <InputComponent :label="t('entity.user.username')" v-model.lazy="credentials.username" :invalid="!!error"/>
            <InputComponent :label="t('entity.user.password')" v-model.lazy="credentials.password" type="password" :invalid="error !== undefined"/>

            <p class="red-text">{{ error }}</p>

            <div class="flex flex-end margin-0">
                <input class="width-100" type="submit" :value="t('action.login')">
            </div>

        </form>

        <form @submit.prevent="changePassword()" v-if="!loading && change">

            <InputComponent :label="t('entity.user.security.oldPassword')" type="password" v-model.lazy="change.old" :invalid="error !== undefined"/>
            <InputComponent :label="t('entity.user.security.newPassword')" type="password" v-model.lazy="change.new" :invalid="error !== undefined"/>
            <InputComponent :label="t('entity.user.security.repeatPassword')" type="password" v-model.lazy="change.repeat" :invalid="error !== undefined"/>
                
            <p class="red-text">{{ t('error.user.password.change.required') || error }}</p>

            <div class="flex flex-end margin-0">
                <input class="width-100" type="submit" :value="t('action.changePassword')">
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
import InputComponent from '@/components/InputComponent.vue';
import type { PasswordChangeRequest } from '@/core/types';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { inject, ref, reactive, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';

const surrealdb = inject('surrealDbService') as SurrealDbService
const { t } = useI18n();

const credentials = reactive({ username: '', password: '' })
const change = ref<PasswordChangeRequest | undefined>()
const loading = ref<boolean>()
const error = ref<string>()

async function login() {
    loading.value = true
    try {
        await surrealdb.signinAndRedirect(toRaw(credentials))
        await surrealdb.redirectPostLogin('/studio')
        error.value = undefined
    } catch (exception) {
        const dbError = surrealdb.parseCustomSurrealDbError(exception)
        if (dbError.success && dbError.key === 'error.user.password.change.required') {
            change.value = { username: credentials.username, old: '', new: '', repeat: '' }
            error.value = undefined
        } else {
            error.value = dbError.success ? t(dbError.key) : dbError.key
        }
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
        await surrealdb.signinAndRedirect(toRaw(credentials))
        await surrealdb.redirectPostLogin('/studio')
    } catch (exception) {
        const dbError = surrealdb.parseCustomSurrealDbError(exception)
        error.value = dbError.success ? t(dbError.key) : dbError.key
    } finally {
        loading.value = false
    }
}

</script>