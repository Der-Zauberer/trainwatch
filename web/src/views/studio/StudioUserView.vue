<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="users.loading" @add="edit = create">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <a v-for="user of users.value" :key="user.id.id.toString()" @click="editRecord = user.id" class="white-text">
                <div><samp class="id">{{ user.id.id.toString() }}</samp></div>
                <div>{{ user.name }}<swd-subtitle>{{ user.email }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent @update="users.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <swd-input>
                <label for="input-id">Id</label>
                <input id="input-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('user', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
            <InputComponent label="Name" v-model="edit.name"></InputComponent>
            <InputComponent label="Email" type="email" v-model="edit.email"></InputComponent>
            <InputComponent label="Password" type="password" v-model="edit.password"></InputComponent>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { User } from '@/core/types';
import { RecordId } from 'surrealdb';
import type Surreal from 'surrealdb';
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
    password: '',
    roles: [],
    permissions: []
}

</script>