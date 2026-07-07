<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :resource="users" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.user.status.status') ]" @add="router.push({ name: 'studio_user_edit', params: { id: 'new' } })">
            <a v-for="user of users.value" :key="user.id.id.toString()" @click="router.push({ name: 'studio_user_edit', params: { id: user.id.id.toString() } })">
                <div><samp class="id">{{ user.id.id.toString() }}</samp></div>
                <div>{{ user.name }}<swd-subtitle>{{ user.email }}</swd-subtitle></div>
                <div>
                    <swd-chip class="green-color" v-if="user.account.enabled && !(user.account.expiry && user.account.expiry < new Date())">{{ $t('entity.user.status.enabled') }}</swd-chip>
                    <swd-chip class="red-color" v-if="!user.account.enabled">{{ $t('entity.user.status.disabled') }}</swd-chip>
                    <swd-chip class="red-color" v-if="user.account.enabled && user.account.expiry && user.account.expiry < new Date()">{{ $t('entity.user.status.expired') }}</swd-chip>
                    <swd-subtitle v-if="user.account.expiry">{{ user.account.expiry?.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</swd-subtitle>
                </div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'user'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" :modelValue="edit.value.id.id" @update:modelValue="edit.value.id = markRaw(new RecordId('user', $event))" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name"/>
            <InputComponent :label="$t('entity.user.email')" type="email" v-model="edit.value.email"/>
            <button v-if="!changePassword" @click="changePassword = true" class="grey-color">{{ $t('action.changePassword') }}</button>
            <InputComponent v-if="changePassword" label="Passwort ändern" v-model="edit.value.password"/>
        </div>

        <h6>{{ $t('entity.user.security.security') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.user.account.enabled')" type="checkbox" v-model="edit.value.account.enabled"/>
            <InputComponent :label="$t('entity.user.account.expiry')" type="date" :value="dateToISODate(edit.value.account.expiry)" @input="edit.value.account.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
            <InputComponent :label="$t('entity.user.credentials.change')" type="checkbox" v-model="edit.value.credentials.change"/>
            <InputComponent :label="$t('entity.user.credentials.expiry')" type="date" :value="dateToISODate(edit.value.credentials.expiry)" @input="edit.value.credentials.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
        </div>

        <h6>{{ $t('entity.role.role', 0) }}</h6>
        <InputTableComponent :header="[ $t('entity.role.role'), '' ]">
            <div v-for="(role, index) in edit.value.roles" :key="index">
                <InputRecordComponent :label="$t('entity.role.role')" v-model="edit.value.roles[index]" type="role" :required="true" :to="edit.value.roles[index] ? { name: 'studio_role_edit', params: { id: edit.value.roles[index].id.toString() } } : undefined"/>
                <button class="grey-color" @click.prevent="edit.value.roles.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
        </InputTableComponent>
        <button class="float-right grey-color" @click.prevent="edit.value.roles.push(undefined as unknown as RecordId<'role'>)"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
        <h6>{{ $t('entity.user.permissions') }}</h6>
        <InputTableComponent :header="[ $t('entity.user.permissions'), '' ]">
        <div v-for="(permission, index) in edit.value.permissions" :key="index">
            <InputComponent :label="$t('entity.user.permissions')" v-model="edit.value.permissions[index]"/>
            <button class=" grey-color" @click.prevent="edit.value.permissions.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
        </div>
        </InputTableComponent>
        <button class="float-right grey-color" @click.prevent="edit.value.permissions.push('')"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
    </EditFormComponent>
</template>

<script setup lang="ts">
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import InputRecordComponent from '@/components/InputRecordComponent.vue'
import InputTableComponent from '@/components/InputTableComponent.vue'
import TableComponent from '@/components/TableComponent.vue'
import { UserEditDto } from '@/core/dtos'
import { dateToISODate, isoDateToDate } from '@/core/functions'
import { resource } from '@/core/resource'
import type { Parameter, User } from '@/core/types'
import { useSurrealDbService } from '@/services/surrealdb.service'
import { RecordId, surql } from 'surrealdb'
import { markRaw, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const surreal = useSurrealDbService()

const changePassword = ref<boolean>(false)

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const users = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surreal.up().then(() => surreal.query<[User[], number]>(`SELECT * FROM user ${parameter.search ? 'WHERE name.lowercase().starts_with($search.lowercase())' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM user ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter))
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new UserEditDto(parameter.route.params.id === 'new' ? {} : await surreal.up().then(() => surreal.select<User>(new RecordId('user', parameter.route.params.id))))
})

const actions: EditActions = {
    save: async (id?: RecordId) => surreal.up().then(async () => id === undefined ? await surreal.insert(edit.value?.filterBeforeSubmit() as any) : await surreal.query(surql`UPDATE ${id} MERGE ${edit.value?.filterBeforeSubmit()}`)),
    delete: async (id: RecordId) => await surreal.up().then(() => surreal.delete(id)),
    close: () => (changePassword.value = false, router.back(), users.reload())
}

</script>