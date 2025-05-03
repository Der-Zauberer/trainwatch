<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="types" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.general.description') ]" @add="router.push({ name: 'studio_type_edit', params: { id: 'new' } })">
            <a v-for="type of types.value" :key="type.id.id.toString()" @click="router.push({ name: 'studio_type_edit', params: { id: type.id.id.toString() } })">
                <div><samp class="id">{{ type.id.id }}</samp></div>
                <div> <DesignationChipComponent :type="type"/></div>
                <div>{{ type.description }}</div>
            </a>
        </TableComponent>
    </div>

    <div class="container-xl" v-if="route.params.id">
        <EditFormComponent v-if="edit.value" :id="edit.value.id" :name="edit.value.name" :events="events">
            <h6>{{ $t('entity.general.general') }}</h6>
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name" :required="true"/>
            <InputComponent :label="$t('entity.general.description')" v-model="edit.value.description" :required="true"/>
            <InputComponent :label="$t('entity.type.priority')" v-model="edit.value.priority"/>
            <InputComponent :label="$t('entity.color.text')" type="color" v-model="edit.value.color.text"/>
            <InputComponent :label="$t('entity.color.background')" type="color" v-model="edit.value.color.background"/>
            <InputDropdownComponent :label="$t('entity.vehicle.vehicle')" v-model="edit.value.vehicle" :display="$t('entity.vehicle.' + edit.value.vehicle)">
                <a v-for="vehicle of enumToArray(Vehicle)" :value="vehicle" :key="vehicle">{{ $t('entity.vehicle.' + vehicle) }}</a>
            </InputDropdownComponent>
            <InputDropdownComponent :label="$t('entity.classification.classification')" v-model="edit.value.classification" :display="$t('entity.classification.' + edit.value.classification)">
                <a v-for="classification of Object.keys(Classification).filter(value => isNaN(Number(value)))" :value="classification" :key="classification">{{  $t('entity.classification.' + classification) }}</a>
            </InputDropdownComponent>
        </EditFormComponent>
    </div>
</template>

<script setup lang="ts">
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditFormComponent from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputDropdownComponent from '@/components/InputDropdownComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { enumToArray } from '@/core/functions';
import { resource } from '@/core/resource';
import { Classification, Vehicle, type Parameter, type Type } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealdb') as Surreal

const create: () => Type = () => ({
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
})

const events = {
    close: async () => (router.back(), types.reload()),
    delete: async () => await surrealdb.delete(new RecordId('type', route.params.id)),
    save: async () => route.params.id === 'new' ? await surrealdb.insert(edit.value) : await surrealdb.upsert(new RecordId('type', route.params.id), edit.value)
}

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const types = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Type[], number]>(`SELECT * FROM type ${parameter.search ? 'WHERE name CONTAINS $search' : 'ORDER BY priority'} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM type ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => parameter.route.params.id === 'new' ? create() : await surrealdb.select<Type>(new RecordId('type', parameter.route.params.id))
})

</script>