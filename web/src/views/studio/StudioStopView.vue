<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" :resource="stops" @add="router.push({ name: 'studio_stop_edit', params: { id: 'new' } })">
            <a v-for="stop of stops.value" :key="stop.id.id.toString()" @click="router.push({ name: 'studio_stop_edit', params: { id: stop.id.id.toString() } })">
                <div><samp class="id">{{ stop.id.id.toString() }}</samp></div>
                <div>{{ stop.name }}<swd-subtitle v-if="stop.address?.federalState || stop.address?.country">{{ [stop.address.federalState, stop.address.country].join(', ') }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <div class="container-xl" v-if="route.params.id">

        <EditFormComponent v-if="edit.value" :id="edit.value.id" :name="edit.value.name" :events="events">
            <h6>{{ $t('entity.general.general') }}</h6>
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name"/>
            <InputComponent :label="$t('entity.stop.score')" type="number" v-model="edit.value.score"/>
            <h6>{{ $t('entity.location.location') }}</h6>
            <InputComponent :label="$t('entity.location.latitude')" type="number" v-model="edit.value.location.latitude"/>
            <InputComponent :label="$t('entity.location.longitude')" type="number" v-model="edit.value.location.longitude"/>
            <h6>{{ $t('entity.address.address') }}</h6>
            <InputComponent :label="$t('entity.address.street')" v-model="edit.value.address.street"/>
            <InputComponent :label="$t('entity.address.zipcode')" v-model="edit.value.address.zipcode"/>
            <InputComponent :label="$t('entity.address.city')" v-model="edit.value.address.city"/>
            <InputComponent :label="$t('entity.address.federalState')" v-model="edit.value.address.federalState"/>
            <InputComponent :label="$t('entity.address.country')" v-model="edit.value.address.country"/>
            <InputComponent :label="$t('entity.address.email')" type="email" v-model="edit.value.address.email"/>
            <InputComponent :label="$t('entity.address.phone')" type="tel" v-model="edit.value.address.phone"/>
            <h6>{{ $t('entity.stop.open.open') }}</h6>
            <InputComponent :label="$t('entity.stop.open.monday')" v-model="edit.value.open.monday"/>
            <InputComponent :label="$t('entity.stop.open.tuesday')" v-model="edit.value.open.tuesday"/>
            <InputComponent :label="$t('entity.stop.open.wednesday')" v-model="edit.value.open.wednesday"/>
            <InputComponent :label="$t('entity.stop.open.thursday')" v-model="edit.value.open.thursday"/>
            <InputComponent :label="$t('entity.stop.open.friday')" v-model="edit.value.open.friday"/>
            <InputComponent :label="$t('entity.stop.open.saturday')" v-model="edit.value.open.saturday"/>
            <InputComponent :label="$t('entity.stop.open.sunday')" v-model="edit.value.open.sunday"/>
        </EditFormComponent>
    </div>

</template>

<script setup lang="ts">
import EditFormComponent from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Parameter, Stop } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const surrealdb = inject('surrealdb') as Surreal

const route = useRoute()
const router = useRouter()

const create: () => Stop = () => ({
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
})

const events = {
    close: async () => router.back(),
    delete: async () => await surrealdb.delete(new RecordId('stop', route.params.id)),
    save: async () => route.params.id === 'new' ? await surrealdb.insert(edit.value) : await surrealdb.upsert(new RecordId('stop', route.params.id), edit.value)
}

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const stops = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Stop[], number]>(`SELECT * FROM stop ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM stop ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => {
        if (parameter.route.params.id === 'new') {
            return create()
        } else if (parameter.route.params.id) {
            return await surrealdb.select<Stop>(new RecordId('stop', parameter.route.params.id))
        }
    }
})

</script>