<template>
    <div class="container-xl">
        <TableComponent v-model="parameter" :resource="journeys" :header="[ $t('entity.general.id'), $t('entity.general.name') ]"  @add="edit = create">
            <div v-for="journey of journeys.value" :key="journey.id.id.toString()" @click="editRecord = journey.id">
                <div><samp class="id">{{ journey.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="journey.line.route" /></span>
                    {{ journey.line.route.name }}
                </div>
            </div>
        </TableComponent>
    </div>
    <EditDialogComponent @update="journeys.reload()" v-model:record="editRecord" v-model:edit="edit">
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
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Journey, Line, Parameter } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter =  reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const journeys = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Journey[], number]>(`SELECT *, line.*, line.route.*, line.route.designations.{type.*, number} FROM journey ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM journey ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Journey | undefined>(undefined)

const create: Journey = {
    id: new RecordId('journey', ''),
    line: undefined as unknown as Line
}


</script>