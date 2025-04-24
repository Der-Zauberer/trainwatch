<template>
    <div class="container-xl">
        <TableComponent v-model="parameter" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" :resource="stops" @add="edit = create">
            <a v-for="stop of stops.value" :key="stop.id.id.toString()" @click="editRecord = stop.id">
                <div><samp class="id">{{ stop.id.id.toString() }}</samp></div>
                <div>{{ stop.name }}<swd-subtitle v-if="stop.address?.federalState || stop.address?.country">{{ [stop.address.federalState, stop.address.country].join(', ') }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent  @update="stops.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-lg-2 grid-cols-1" v-if="edit">
            <div class="grid-cols-sm-2 grid-cols-1">
                <h6 class="grid-span-sm-2 grid-span-1">{{ $t('entity.general.general') }}</h6>
                <InputComponent :label="$t('entity.general.id')" :disabled="!!editRecord" v-model="edit.id.id"></InputComponent>
                <InputComponent :label="$t('entity.general.name')" v-model="edit.name"></InputComponent>
                <InputComponent :label="$t('entity.stop.score')" type="number" v-model="edit.score"></InputComponent>
            </div>
            <div class="grid-cols-sm-2 grid-cols-1">
                <h6 class="grid-span-sm-2 grid-span-1">{{ $t('entity.location.location') }}</h6>
                <InputComponent :label="$t('entity.location.latitude')" type="number" v-model="edit.location.latitude"></InputComponent>
                <InputComponent :label="$t('entity.location.longitude')" type="number" v-model="edit.location.longitude"></InputComponent>
            </div>
            <div class="grid-cols-sm-2 grid-cols-1">
                <h6 class="grid-span-sm-2 grid-span-1">{{ $t('entity.address.address') }}</h6>
                <InputComponent :label="$t('entity.address.street')" v-model="edit.address.street" class="grid-span-sm-2 grid-span-1"></InputComponent>
                <InputComponent :label="$t('entity.address.zipcode')" v-model="edit.address.zipcode"></InputComponent>
                <InputComponent :label="$t('entity.address.city')" v-model="edit.address.city"></InputComponent>
                <InputComponent :label="$t('entity.address.federalState')" v-model="edit.address.federalState"></InputComponent>
                <InputComponent :label="$t('entity.address.country')" v-model="edit.address.country"></InputComponent>
                <InputComponent :label="$t('entity.address.email')" type="email" v-model="edit.address.email"></InputComponent>
                <InputComponent :label="$t('entity.address.phone')" type="tel" v-model="edit.address.phone"></InputComponent>
            </div>
            <div class="grid-cols-sm-2 grid-cols-1">
                <h6 class="grid-span-sm-2 grid-span-1">{{ $t('entity.stop.open.open') }}</h6>
                <InputComponent :label="$t('entity.stop.open.monday')" v-model="edit.open.monday"></InputComponent>
                <InputComponent :label="$t('entity.stop.open.tuesday')" v-model="edit.open.tuesday"></InputComponent>
                <InputComponent :label="$t('entity.stop.open.wednesday')" v-model="edit.open.wednesday"></InputComponent>
                <InputComponent :label="$t('entity.stop.open.thursday')" v-model="edit.open.thursday"></InputComponent>
                <InputComponent :label="$t('entity.stop.open.friday')" v-model="edit.open.friday"></InputComponent>
                <InputComponent :label="$t('entity.stop.open.saturday')" v-model="edit.open.saturday"></InputComponent>
                <InputComponent :label="$t('entity.stop.open.sunday')" v-model="edit.open.sunday"></InputComponent>
            </div>
            
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Parameter, Stop } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const stops = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Stop[], number]>(`SELECT * FROM stop ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM stop ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
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