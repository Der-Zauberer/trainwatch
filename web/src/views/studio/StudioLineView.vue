<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="lines.loading" @add="edit = create" >
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <a v-for="line of lines.value" :key="line.id.id.toString()"  @click="editRecord = line.id">
                <div><samp class="id">{{ line.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span>
                        <swd-chip v-for="designation of line.route.designations" :key="designation.number" :style="`color: ${designation.type.color.text}; background-color: ${designation.type.color.background};`">
                            {{ designation.type.name }} {{ designation.number }}
                        </swd-chip>
                    </span>
                    {{ line.route.name }}
                </div>
            </a>
        </TableComponent>
    </div>
    <EditDialogComponent @update="lines.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <swd-input>
                <label for="input-id">Id</label>
                <input id="input-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('line', (event.target as HTMLInputElement).value) : ''">
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
import type { Line, Route } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const lines = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Line[][]>(`SELECT *, route.*, route.designations.{type.*, number} FROM line ${ parameter.name ? 'WHERE route.name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Line | undefined>(undefined)

const create: Line = {
    id: new RecordId('line', ''),
    route: undefined as unknown as Route
}

</script>