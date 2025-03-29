<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="journeys.loading"  @add="edit = create">
            <div>
                <div>{{ $t('entity.general.id') }}</div>
                <div>{{ $t('entity.general.name') }}</div>
            </div>
            <div v-for="journey of journeys.value" :key="journey.id.id.toString()" @click="editRecord = journey.id">
                <div><samp class="id">{{ journey.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span>
                        <DesignationChip v-for="designation of journey.line.route.designations" :key="designation.type.name + designation.number" :type="designation.type" :number="designation.number"/>
                    </span>
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
import DesignationChip from '@/components/DesignationChip.vue';
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Journey, Line } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const journeys = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Journey[][]>(`SELECT *, line.*, line.route.*, line.route.designations.{type.*, number} FROM journey ${ parameter.name ? 'WHERE line.route.name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Journey | undefined>(undefined)

const create: Journey = {
    id: new RecordId('journey', ''),
    line: undefined as unknown as Line
}


</script>