<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="roles" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="router.push({ name: 'studio_role_edit', params: { id: 'new' } })">
            <a v-for="role of roles.value" :key="role.id.id.toString()" @click="router.push({ name: 'studio_role_edit', params: { id: role.id.id.toString() } })">
                <div><samp class="id">{{ role.id.id.toString() }}</samp></div>
                <div>{{ role.name }}</div>
            </a>
        </TableComponent>
    </div>

    <div class="container-xl" v-if="route.params.id">
        <EditFormComponent v-if="edit.value" :id="edit.value.id" :name="edit.value.name" :events="events">
            <h6>{{ $t('entity.general.general') }}</h6>
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name" :required="true"/>
            <h6>{{ $t('entity.user.permissions') }}</h6>
            <div class="flex margin-bottom-0" v-for="(permission, index) in edit.value.permissions" :key="index">
                <InputComponent v-model="edit.value.permissions[index]"></InputComponent>
                <button class="grey-color" @click.prevent="edit.value.permissions.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
            <button class="grey-color" @click.prevent="edit.value.permissions.push('')"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
        </EditFormComponent>
    </div>
</template>

<script setup lang="ts">
import EditFormComponent from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Parameter, Role } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealdb') as Surreal

const create: () => Role = () => ({
    id: new RecordId('role', ''),
    name: '',
    permissions: []
})

const events = {
    close: async () => (router.back(), roles.reload()),
    delete: async () => await surrealdb.delete(new RecordId('role', route.params.id)),
    save: async () => route.params.id === 'new' ? await surrealdb.insert(edit.value) : await surrealdb.upsert(new RecordId('role', route.params.id), edit.value)
}

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const roles = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Role[], number]>(`SELECT * FROM role ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM role ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => parameter.route.params.id === 'new' ? create() : await surrealdb.select<Role>(new RecordId('role', parameter.route.params.id))
})

</script>