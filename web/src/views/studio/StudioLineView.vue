<template>
    <div class="container-xl">
        <TableComponent v-model="parameter" :resource="lines" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="edit = create" >
            <a v-for="line of lines.value" :key="line.id.id.toString()"  @click="editRecord = line.id">
                <div><samp class="id">{{ line.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="line.route"/></span>
                    {{ line.route.name }}
                </div>
            </a>
        </TableComponent>
    </div>
    <EditDialogComponent @update="lines.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <InputComponent :label="$t('entity.general.id')" :disabled="!!editRecord" v-model="edit.id.id"></InputComponent>
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
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { Line, Parameter, Route } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const lines = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Line[], number]>(`SELECT *, route.designations.{type.*, number} FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Line | undefined>(undefined)

const create: Line = {
    id: new RecordId('line', ''),
    route: undefined as unknown as Route
}

</script>