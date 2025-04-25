<template>
    <div class="container-xl">
        <TableComponent v-model="parameter" :resource="types" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.general.description') ]" @add="edit = create">
            <a v-for="type of types.value" :key="type.id.id.toString()" @click="editRecord = type.id">
                <div><samp class="id">{{ type.id.id }}</samp></div>
                <div> <DesignationChipComponent :type="type"/></div>
                <div>{{ type.description }}</div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent @update="types.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <InputComponent :label="$t('entity.general.id')" :disabled="!!editRecord" v-model="edit.id.id"></InputComponent>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.name"></InputComponent>
            <InputComponent :label="$t('entity.general.description')" v-model="edit.description"></InputComponent>
            <InputComponent :label="$t('entity.type.priority')" v-model="edit.priority"></InputComponent>
            <InputComponent :label="$t('entity.color.text')" type="color" v-model="edit.color.text"></InputComponent>
            <InputComponent :label="$t('entity.color.background')" type="color" v-model="edit.color.background"></InputComponent>
            <InputDropdownComponent :label="$t('entity.vehicle.vehicle')" v-model="edit.vehicle" :display="$t('entity.vehicle.' + edit.vehicle)">
                <a v-for="vehicle of enumToArray(Vehicle)" :value="vehicle" :key="vehicle">{{ $t('entity.vehicle.' + vehicle) }}</a>
            </InputDropdownComponent>
            <InputDropdownComponent :label="$t('entity.classification.classification')" v-model="edit.classification" :display="$t('entity.classification.' + edit.classification)">
                <a v-for="classification of Object.keys(Classification).filter(value => isNaN(Number(value)))" :value="classification" :key="classification">{{  $t('entity.classification.' + classification) }}</a>
            </InputDropdownComponent>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputDropdownComponent from '@/components/InputDropdownComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { enumToArray } from '@/core/functions';
import { resource } from '@/core/resource';
import { Classification, Vehicle, type Parameter, type Type } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const types = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Type[], number]>(`SELECT * FROM type ${parameter.search ? 'WHERE name CONTAINS $search' : 'ORDER BY priority'} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM type ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
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