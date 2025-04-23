<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :resource="users" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="edit = create">
            <a v-for="user of users.value" :key="user.id.id.toString()" @click="editRecord = user.id">
                <div><samp class="id">{{ user.id.id.toString() }}</samp></div>
                <div>{{ user.name }}<swd-subtitle>{{ user.email }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent @update="users.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <h6 class="grid-span-sm-2 grid-span-1">{{ $t('entity.general.general') }}</h6>
            <InputComponent :label="$t('entity.general.id')" :disabled="!!editRecord" v-model="edit.id.id"></InputComponent>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.name"></InputComponent>
            <InputComponent :label="$t('entity.user.email')" type="email" v-model="edit.email"></InputComponent>
            <!--<InputComponent :label="$t('entity.user.password')" type="password" v-model="edit.password"></InputComponent>-->
            <h6 class="grid-span-sm-2 grid-span-1">{{ $t('entity.role.role', 0) }}</h6>
            <div class="flex" v-for="(role, index) in edit.roles" :key="index">
                <InputComponent v-model="edit.roles[index]"></InputComponent>
                <button class="red-color" @click="edit.roles.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
            <button><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
            <h6 class="grid-span-sm-2 grid-span-1">{{ $t('entity.user.permissions') }}</h6>
            <div class="flex" v-for="(permission, index) in edit.permissions" :key="index">
                <InputComponent v-model="edit.permissions[index]"></InputComponent>
                <button class="red-color" @click="edit.permissions.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
            <button @click="edit.permissions.push('')"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { User } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const users = resource({
    parameter,
	loader: (parameter) => surrealdb.query<User[][]>(`SELECT * FROM user ${ parameter.name ? 'WHERE (name CONTAINS $name || email CONTAINS $name)' : '' } LIMIT 1000`).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<User | undefined>(undefined)

const create: User = {
    id: new RecordId('user', ''),
    name: '',
    email: '',
    roles: [],
    permissions: []
}

</script>