<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="stops.loading" @add="edit = create">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <a v-for="stop of stops.value" :key="stop.id.id.toString()" @click="editRecord = stop.id" class="white-text">
                <div><samp class="id">{{ stop.id.id.toString() }}</samp></div>
                <div>{{ stop.name }}<swd-subtitle>{{ [stop.address.federalState, stop.address.country].join(', ') }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent  @update="stops.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-sm-2 grid-cols-1" v-if="edit">
            <swd-input>
                <label for="input-id">Id</label>
                <input id="input-id" :disabled="!!editRecord" :value="edit.id.id" @input="event => edit ? edit.id = new RecordId('stop', (event.target as HTMLInputElement).value) : ''">
            </swd-input>
            <InputComponent label="Name" v-model="edit.name"></InputComponent>
            <InputComponent label="Ccore" type="number" v-model="edit.score"></InputComponent>
            <InputComponent label="Latitude" type="number" v-model="edit.location.latitude"></InputComponent>
            <InputComponent label="longitude" type="number" v-model="edit.location.longitude"></InputComponent>
            <InputComponent label="Street" v-model="edit.address.street"></InputComponent>
            <InputComponent label="Zip Code" v-model="edit.address.zipcode"></InputComponent>
            <InputComponent label="City" v-model="edit.address.city"></InputComponent>
            <InputComponent label="Federal State" v-model="edit.address.federalState"></InputComponent>
            <InputComponent label="Country" v-model="edit.address.country"></InputComponent>
            <InputComponent label="Monday" v-model="edit.open.monday"></InputComponent>
            <InputComponent label="Tuesday" v-model="edit.open.tuesday"></InputComponent>
            <InputComponent label="Wednesday" v-model="edit.open.wednesday"></InputComponent>
            <InputComponent label="Thursday" v-model="edit.open.thursday"></InputComponent>
            <InputComponent label="Friday" v-model="edit.open.friday"></InputComponent>
            <InputComponent label="Saturday" v-model="edit.open.saturday"></InputComponent>
            <InputComponent label="Sunday" v-model="edit.open.sunday"></InputComponent>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Stop } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const stops = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Stop[][]>(`SELECT * FROM stop ${parameter.name ? 'WHERE name CONTAINS $name' : ''} LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Stop | undefined>(undefined)

const create: Stop = {
    id: new RecordId('stop', ''),
    name: '',
    score: 99,
    platforms: [],
    location: {
        latitude: 0,
        longitude: 0
    },
    address: {
        street: '',
        zipcode: '',
        city: '',
        federalState: '',
        country: ''
    },
    open: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: '',
    },
    services: {
        parking: false,
        localPublicTransport: false,
        carRental: false,
        taxi: false,
        publicFacilities: false,
        travelNecessities: false,
        locker: false,
        wifi: false,
        information: false,
        railwayMission: false,
        lostAndFound: false,
        barrierFree: false,
        mobilityService: '',
    },
    ids: {},
    sources: [],
}

</script>