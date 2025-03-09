<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="routes.loading" @add="edit = create">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <a v-for="route of routes.value" :key="route.id.id.toString()" @click="editRecord = route.id">
                <div><samp class="id">{{ route.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span>
                        <swd-chip v-for="designation of route.designations" :key="designation.number" :style="`color: ${designation.type.color.text}; background-color: ${designation.type.color.background};`">
                            {{ designation.type.name }} {{ designation.number }}
                        </swd-chip>
                    </span>
                    {{ route.name }}
                </div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent @update="routes.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <swd-input>
                <label for="input-id">Id</label>
                <input id="input-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('route', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
            <swd-input>
                <label for="input-name">Name</label>
                <input id="input-name" :disabled="!!editRecord" :value="edit.name" @input="event => edit ? edit.name = (event.target as HTMLInputElement).value : ''">
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
import type { Route } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const routes = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Route[][]>(`SELECT *, designations.{type.*, number} FROM route ${ parameter.name ? 'WHERE name CONTAINS $name' : ''} LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
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