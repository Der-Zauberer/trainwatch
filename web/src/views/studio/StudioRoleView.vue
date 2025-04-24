<template>
    <div class="container-xl">
        <TableComponent v-model="parameter" :resource="roles" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="edit = create">
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
import type { Parameter, Role } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const roles = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Role[], number]>(`SELECT * FROM role ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM role ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Role | undefined>(undefined)

const create: Role = {
    id: new RecordId('role', ''),
    name: '',
    permissions: []
}

</script>