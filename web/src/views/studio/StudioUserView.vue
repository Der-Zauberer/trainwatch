<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="users" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="router.push({ name: 'studio_user_edit', params: { id: 'new' } })">
            <a v-for="user of users.value" :key="user.id.id.toString()" @click="router.push({ name: 'studio_user_edit', params: { id: user.id.id.toString() } })">
                <div><samp class="id">{{ user.id.id.toString() }}</samp></div>
                <div>{{ user.name }}<swd-subtitle>{{ user.email }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'user'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name"/>
            <InputComponent :label="$t('entity.user.email')" type="email" v-model="edit.value.email"/>
        </div>
        <h6>{{ $t('entity.role.role', 0) }}</h6>
        <div class="input-array" v-for="(role, index) in edit.value.roles" :key="index">
            <InputRecordComponent :label="$t('entity.role.role')" v-model="edit.value.roles[index]" type="role" :required="true" />
            <button class="grey-color" @click.prevent="edit.value.roles.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
        </div>
        <button class="grey-color" @click.prevent="{}"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
        <h6>{{ $t('entity.user.permissions') }}</h6>
        <div class="input-array" v-for="(permission, index) in edit.value.permissions" :key="index">
            <InputComponent :label="$t('entity.user.permissions')" v-model="edit.value.permissions[index]"/>
            <button class="grey-color" @click.prevent="edit.value.permissions.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
        </div>
        <button class="grey-color" @click.prevent="edit.value.permissions.push('')"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
    </EditFormComponent>
</template>

<style scoped>

.input-array {
    display: grid;
    grid-template-columns: 1fr fit-content(0);
    gap: var(--theme-inner-element-spacing);
    margin-bottom: var(--theme-element-spacing);
    align-items: center;
}

</style>

<script setup lang="ts">
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputRecordComponent from '@/components/InputRecordComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { UserEditDto } from '@/core/dtos';
import { resource } from '@/core/resource';
import type { Parameter, User } from '@/core/types';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealDbService') as SurrealDbService

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const users = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[User[], number]>(`SELECT * FROM user ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM user ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new UserEditDto(parameter.route.params.id === 'new' ? {} : await surrealdb.select<User>(new RecordId('user', parameter.route.params.id)))
})

const actions: EditActions = {
    save: async (id?: RecordId) => id === undefined ? await surrealdb.insert(edit.value?.filterBeforeSubmit()) : await surrealdb.update(id, edit.value?.filterBeforeSubmit()),
    delete: async (id: RecordId) => await surrealdb.delete(id),
    close: () => (router.back(), users.reload())
}

</script>