<template>
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
                <label for="input-id">Id</label>
                <input id="input-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('type', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
            <InputComponent label="Name" v-model="edit.name"></InputComponent>
            <InputComponent label="Description" v-model="edit.description"></InputComponent>
            <InputComponent label="Priority" v-model="edit.priority"></InputComponent>
            <InputComponent label="Text Color" type="color" v-model="edit.color.text"></InputComponent>
            <InputComponent label="Background Color" type="color" v-model="edit.color.background"></InputComponent>
            <InputDropdownComponent label="Vehicle" v-model="edit.vehicle">
                <a v-for="vehicle of enumToArray(Vehicle)" :value="vehicle" :key="vehicle">{{ vehicle }}</a>
            </InputDropdownComponent>
            <InputDropdownComponent label="Classification" v-model="edit.classification">
                <a v-for="classification of Object.keys(Classification).filter(value => isNaN(Number(value)))" :value="classification" :key="classification">{{ classification }}</a>
            </InputDropdownComponent>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputDropdownComponent from '@/components/InputDropdownComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import { Classification, Vehicle, type Type } from '@/core/types';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';
import type Surreal from 'surrealdb';
import { enumToArray } from '@/core/functions';

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