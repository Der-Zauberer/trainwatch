<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="operators.loading" @add="edit = create">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <a v-for="operator of operators.value" :key="operator.id.id.toString()" @click="editRecord = operator.id">
                <div><samp class="id">{{ operator.id.id.toString() }}</samp></div>
                <div>{{ operator.name }}<swd-subtitle>{{ [operator.address.federalState, operator.address.country].join(', ') }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent  @update="operators.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <swd-input>
                <label for="input-id">Id</label>
                <input id="input-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('operator', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
            <InputComponent label="Name" v-model="edit.name"></InputComponent>
            <InputComponent label="Street" v-model="edit.address.street"></InputComponent>
            <InputComponent label="Zip Code" v-model="edit.address.zipcode"></InputComponent>
            <InputComponent label="City" v-model="edit.address.city"></InputComponent>
            <InputComponent label="Federal State" v-model="edit.address.federalState"></InputComponent>
            <InputComponent label="Country" v-model="edit.address.country"></InputComponent>
            <InputComponent label="Website" v-model="edit.website"></InputComponent>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Operator } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const operators = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Operator[][]>(`SELECT * FROM operator ${ parameter.name ? 'WHERE name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Operator | undefined>(undefined)

const create: Operator = {
    id: new RecordId('operator', ''),
    name: '',
    address: {
        street: '',
        zipcode: '',
        city: '',
        federalState: '',
        country: ''
    },
    website: ''
}

</script>