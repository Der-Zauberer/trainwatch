<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="journeys.loading"  @add="edit = create">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <div v-for="journey of journeys.value" :key="journey.id.id.toString()" @click="editRecord = journey.id" class="white-text">
                <div><samp class="id">{{ journey.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span>
                        <swd-chip v-for="designation of journey.line.route.designations" :key="designation.number" :style="`color: ${designation.type.color.text}; background-color: ${designation.type.color.background};`">
                            {{ designation.type.name }} {{ designation.number }}
                        </swd-chip>
                    </span>
                    {{ journey.line.route.name }}
                </div>
            </div>
        </TableComponent>
    </div>
    <EditDialogComponent @update="journeys.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <swd-input>
                <label for="input-id">Id</label>
                <input id="input-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('journey', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
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
    id: new RecordId('line', ''),
    line: undefined as unknown as Line
}


</script>