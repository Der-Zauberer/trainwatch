<template>
    {{ editRecord }}
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="types.loading" @add="edit = create" columns="max-content max-content auto">
            <div>
                <div>Id</div>
                <div>Name</div>
                <div>Description</div>
            </div>
            <a v-for="type of types.value" :key="type.id.id.toString()" @click="editRecord = type.id" class="white-text">
                <div><samp class="id">{{ type.id.id }}</samp></div>
                <div><swd-chip :style="`color: ${type.color.text}; background-color: ${type.color.background};`">{{ type.name }}</swd-chip></div>
                <div>{{ type.description }}</div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent @update="types.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <swd-input>
                <label for="type-id">Id</label>
                <input id="type-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('type', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
            <swd-input>
                <label for="type-name">Name</label>
                <input id="type-name" v-model="edit.name">
            </swd-input>
            <swd-input>
                <label for="type-description">Description</label>
                <input id="type-description" v-model="edit.description">
            </swd-input>
            <swd-input>
                <label for="type-priority">Priority</label>
                <input id="type-priority" v-model="edit.priority">
            </swd-input>
            <swd-input>
                <label for="type-color-text">Text Color</label>
                <input id="type-color-text" type="color" v-model="edit.color.text">
            </swd-input>
            <swd-input>
                <label for="type-color-background">Background Color</label>
                <input id="type-color-background" type="color" v-model="edit.color.background">
            </swd-input>

            <InputDropdownComponent id="type-vehicle" label="Vehicle" v-model="edit.vehicle">
                <a v-for="vehicle of Object.keys(Vehicle).filter(value => isNaN(Number(value)))" :value="vehicle" :key="vehicle">{{ vehicle }}</a>
            </InputDropdownComponent>

            <InputDropdownComponent id="type-classification" label="Classification" v-model="edit.classification">
                <a v-for="classification of Object.keys(Classification).filter(value => isNaN(Number(value)))" :value="classification" :key="classification">{{ classification }}</a>
            </InputDropdownComponent>

        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputDropdownComponent from '@/components/InputDropdownComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import { Classification, Vehicle, type Type } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const types = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Type[][]>(`SELECT * FROM type ${ parameter.name ? 'WHERE name CONTAINS $name' : ''} ORDER BY priority LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Type | undefined>(undefined)

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

</script>