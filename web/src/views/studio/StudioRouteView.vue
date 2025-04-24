<template>
    <div class="container-xl">
        <TableComponent v-model="parameter" :resource="routes" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="edit = create">
            <a v-for="route of routes.value" :key="route.id.id.toString()" @click="editRecord = route.id">
                <div><samp class="id">{{ route.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="route" /></span>
                    {{ route.name }}
                </div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent @update="routes.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <InputComponent :label="$t('entity.general.id')" :disabled="!!editRecord" v-model="edit.id.id"></InputComponent>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.name"></InputComponent>
        </div>
    </EditDialogComponent>
</template>

<style scoped>
.flex {
    margin: 0;
    --theme-element-spacing: calc(var(--theme-inner-element-spacing) / 2)
}
</style>

<script setup lang="ts">
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Parameter, Route } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const routes = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Route[], number]>(`SELECT *, designations.{type.*, number} FROM route ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM route ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Route | undefined>(undefined)

const create: Route = {
    id: new RecordId('route', ''),
    name: '',
    designations: [],
    operator: undefined
}

</script>