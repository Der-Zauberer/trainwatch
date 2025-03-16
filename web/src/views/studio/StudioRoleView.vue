<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="roles.loading" @add="edit = create">
            <div>
                <div>{{ $t('entity.general.id') }}</div>
                <div>{{ $t('entity.general.name') }}</div>
            </div>
            <a v-for="role of roles.value" :key="role.id.id.toString()" @click="editRecord = role.id">
                <div><samp class="id">{{ role.id.id.toString() }}</samp></div>
                <div>{{ role.name }}</div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent @update="roles.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <InputComponent :label="$t('entity.general.id')" :disabled="!!editRecord" v-model="edit.id.id"></InputComponent>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.name"></InputComponent>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Role } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const roles = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Role[][]>(`SELECT * FROM role ${ parameter.name ? 'WHERE name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Role | undefined>(undefined)

const create: Role = {
    id: new RecordId('role', ''),
    name: '',
    permissions: []
}

</script>