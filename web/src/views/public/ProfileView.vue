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
                <InputComponent label="Old Password" type="password" v-model="password.old"/>
                <InputComponent label="New Password" type="password" v-model="password.new"/>
                <InputComponent label="New Password" type="password" v-model="password.new2"/>
                <p class="red-text" v-if="password.error">{{ password.error }}</p>
                <input type="submit" :value="$t('action.changePassword')">
            </form>

        </div>

    </div>

</template>

<script setup lang="ts">
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { User } from '@/core/types';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { surql, SurrealDbError } from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealDbService') as SurrealDbService

const profile = resource({
    loader: () => surrealdb.info<User>()
})

const password = reactive<{ old?: string, new?: string, new2?: string, error?: string }>({})

async function changePassword() {
    try {
        await surrealdb.query(surql`fn::user::change_password(${ password.old }, ${ password.new }, ${ password.new2 })`)
        delete password.old
        delete password.new
        delete password.new2
        delete password.error
    } catch (error) {
        password.error = (error as SurrealDbError).message
    }
}
</script>