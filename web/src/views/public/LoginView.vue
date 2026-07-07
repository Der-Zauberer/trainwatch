<template>
    <swd-card-outline class="grid-cols-1">

        <h3>{{ t('action.login') }}</h3>

        <swd-loading-spinner loading="true" v-if="loading"></swd-loading-spinner>

        <form v-if="!loading && !change" @submit.prevent="login()">
            <InputDropdownComponent :label="t('action.selectServer')" v-model="profile">
                <a v-for="profile in config.profiles" :value="profile.name">{{ profile.name }}</a>
            </InputDropdownComponent>
            <InputComponent :label="t('entity.user.username')" v-model.lazy="credentials.username" :invalid="!!error"/>
            <InputComponent :label="t('entity.user.password')" v-model.lazy="credentials.password" type="password" :invalid="error !== undefined"/>

            <p class="red-text">{{ error }}</p>

            <div class="flex flex-end margin-0">
                <input class="width-100" type="submit" :value="t('action.login')">
            </div>

        </form>

        <form v-if="!loading && change" @submit.prevent="changePassword(change)">

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
    height: calc(3 * var(--theme-inner-element-spacing) + round(2.2em, 1px) + 3 * 58px) !important;
}

form { display: contents }
form * { margin: 0 }

@media only screen and (max-width: 575px) { swd-card-outline {
    border: 0;
}}

</style>

<script setup lang="ts">
import InputComponent from '@/components/InputComponent.vue'
import InputDropdownComponent from '@/components/InputDropdownComponent.vue'
import { config, parseCustomSurrealDbError, useSurrealDbService, type PasswordChangeRequest } from '@/services/surrealdb.service'
import { ref, reactive, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'

const surreal = useSurrealDbService()
const { t } = useI18n()
const profiles = surreal.getProfile()

const credentials = reactive({ username: '', password: '' })
const profile = ref<string>(profiles.default.name)
const change = ref<PasswordChangeRequest | undefined>()
const loading = ref<boolean>()
const error = ref<string>()

async function login() {
    loading.value = true
    try {
        if (profile.value !== profiles.default.name) await surreal.up(config.profiles.find(current => profile.value == current.name))
        await surreal.signin(toRaw(credentials))
        await surreal.redirectPostLogin('/studio')
        error.value = undefined
    } catch (exception) {
        const key = parseCustomSurrealDbError(exception as Error).key
        if (key === 'error.user.password.change.required') {
            change.value = { username: credentials.username, old: '', new: '', repeat: '' }
            error.value = undefined
        } else {
            error.value = key ? t(key) : key
        }
    } finally {
        loading.value = false
    }
}

async function changePassword(credentials: PasswordChangeRequest) {
    loading.value = true
    try {
        await surreal.changePassword(credentials)
        await surreal.redirectPostLogin('/studio')
        change.value = undefined
    } catch (exception) {
        const key = parseCustomSurrealDbError(exception as Error).key
        error.value = key ? t(key) : key
    } finally {
        loading.value = false
    }
}

</script>