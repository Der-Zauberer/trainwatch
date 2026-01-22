<template>

    <div class="container-md">
        
        <h2>{{ $t('page.profile') }}</h2>

        <div class="grid-cols-sm-2 grid-cols-1">

            <div v-if="profile.value" class="grid-cols-1">
                <h6>{{ $t('entity.general.general') }}</h6>
                <InputComponent :label="$t('entity.general.id')" v-model="profile.value.id.id" disabled readonly />
                <InputComponent :label="$t('entity.user.email')" type="email" v-model="profile.value.email" disabled/>
                <InputComponent :label="$t('entity.general.name')" v-model="profile.value.name" disabled/>
            </div>

            <form v-if="profile.value" class="grid-cols-1" @submit.prevent="changePassword()">
                <h6>{{ $t('action.changePassword') }}</h6>
                <InputComponent :label="t('entity.user.security.oldPassword')" type="password" v-model="password.old"/>
                <InputComponent :label="t('entity.user.security.newPassword')" type="password" v-model="password.new"/>
                <InputComponent :label="t('entity.user.security.repeatPassword')" type="password" v-model="password.repeat"/>
                <p class="red-text" v-if="password.error">{{ password.error }}</p>
                <p class="green-text" v-if="password.success">{{ t('event.user.password.change') }}</p>
                <input type="submit" :value="$t('action.changePassword')">
            </form>

        </div>

    </div>

</template>

<script setup lang="ts">
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import { type User } from '@/core/types';
import { parseCustomSurrealDbError, SURREAL_DB_SERVICE, type PasswordChangeRequest, type SurrealDbService } from '@/services/surrealdb.service';
import { inject, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const { t } = useI18n();

const profile = resource({
    loader: () => surrealdb.info<User>()
})

const password = reactive<PasswordChangeRequest & { error?: string } & { success?: boolean }>({ username: '' , old: '', new: '', repeat: '' })

async function changePassword() {
    try {
        await surrealdb.changePassword({ ...password, username: profile.value?.name || ''})
        password.old = ''
        password.new = ''
        password.repeat = ''
        delete password.error
        password.success = true
    } catch (exception) {
        const dbError = parseCustomSurrealDbError(exception as Error)
        password.error = dbError.success ? t(dbError.key) : dbError.key
        password.success = false
    }
}
</script>