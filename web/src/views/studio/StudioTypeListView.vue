<template>
    <div class="container-xl">

        <TableComponent v-model="parameter.name" :loading="types.loading" @add="edit.reload(create)" columns="max-content max-content auto">
            <div>
                <div>Id</div>
                <div>Name</div>
                <div>Description</div>
            </div>
            <a v-for="type of types.value" :key="type.id.id.toString()" @click="editParameter.record = type.id" class="white-text">
                <div><samp class="id">{{ type.id.id }}</samp></div>
                <div><swd-chip :style="`color: ${type.color.text}; background-color: ${type.color.background};`">{{ type.name }}</swd-chip></div>
                <div>{{ type.description }}</div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent 
        v-if="edit.value" 
        :title="edit.value.name" 
        :loading="edit.loading" 
        @save="saveType(edit.value); editParameter.record = undefined; edit.reload(undefined)" 
        @cancel="editParameter.record = undefined; edit.reload(undefined)"
    >
        <div class="grid-cols-sm-2 grid-cols-1">
            <swd-input>
                <label for="type-id">Id</label>
                <input id="type-id" :disabled="!!editParameter.record" :value="edit.value.id.id" @input="event => edit.value ? edit.value.id = new RecordId('type', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
            <swd-input>
                <label for="type-name">Name</label>
                <input id="type-name" v-model="edit.value.name">
            </swd-input>
            <swd-input>
                <label for="type-description">Description</label>
                <input id="type-description" v-model="edit.value.description">
            </swd-input>
            <swd-input>
                <label for="type-priority">Priority</label>
                <input id="type-priority" v-model="edit.value.priority">
            </swd-input>
            <swd-input>
                <label for="type-color-text">Text Color</label>
                <input id="type-color-text" type="color" v-model="edit.value.color.text">
            </swd-input>
            <swd-input>
                <label for="type-color-background">Background Color</label>
                <input id="type-color-background" type="color" v-model="edit.value.color.background">
            </swd-input>

            <swd-dropdown>
                <swd-input>
                    <label for="type-vehicle">Vehicle</label>
                    <input id="type-vehicle" readonly :value="edit.value?.vehicle.toString()">
                    <swd-icon class="down-icon" swd-input-icon></swd-icon>
                </swd-input>
                <input hidden v-model="edit.value.vehicle">
                <swd-dropdown-content>
                    <swd-selection onselect="edit.value.vehicle">
                        <a v-for="vehicle of Object.keys(Vehicle).filter(value => isNaN(Number(value)))" :value="vehicle" :key="vehicle">{{ vehicle }}</a>
                    </swd-selection>
                </swd-dropdown-content>
            </swd-dropdown>

            <swd-dropdown>
                <swd-input>
                    <label for="type-classification">Classification</label>
                    <input id="type-classification" readonly :value="edit.value?.classification">
                    <swd-icon class="down-icon" swd-input-icon></swd-icon>
                </swd-input>
                <input hidden v-model="edit.value.classification">
                <swd-dropdown-content>
                    <swd-selection onselect="edit.value.classification">
                        <a v-for="classification of Object.keys(Classification).filter(value => isNaN(Number(value)))" :value="classification" :key="classification">{{ classification }}</a>
                    </swd-selection>
                </swd-dropdown-content>
            </swd-dropdown>

            <button class="red-color" @click="deleteType(edit.value)"><swd-icon class="delete-icon"></swd-icon> Delete</button>

        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import { Classification, Vehicle, type Type } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const types = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Type[][]>(`SELECT * FROM type ${ parameter.name ? 'WHERE name CONTAINS $name' : ''} ORDER BY priority LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editParameter = reactive<{ record: RecordId<string> | undefined }>({ record: undefined })
const edit = resource<Type | undefined, { record: RecordId<string> | undefined }>({
    parameter: editParameter,
    loader: (edit) => edit.record ? surrealdb.select<Type>(edit.record) : undefined
})

const create: Type = {
    id: new RecordId('type', ''),
    name: '',
    description: '',
    priority: 99,
    color: {
        text: '#000000',
        background: '#ffffff',
    },
    vehicle: 'BUS',
    classification: 'REGIONAL'
}

async function saveType(type: Type) {
    if (type.id.id === '') type.id = undefined as unknown as RecordId<string>
    await surrealdb.upsert<Type>('type', type).then(array => array[0])
    await types.reload()
}

async function deleteType(type: Type) {
    await surrealdb.delete(type.id)
    editParameter.record = undefined
    await edit.reload()
    await types.reload()
}

</script>