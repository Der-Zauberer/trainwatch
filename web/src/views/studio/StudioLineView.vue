<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="lines" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.timetable.timetable') ]" @add="router.push({ name: 'studio_line_edit', params: { id: 'new' } })" >
            <a v-for="line of lines.value" :key="line.id.id.toString()"  @click="router.push({ name: 'studio_line_edit', params: { id: line.id.id.toString() } })">
                <div><samp class="id">{{ line.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="line.route"/></span>
                    {{ line.route.name }}
                </div>
                <div>{{ line.route.timetable.name }}</div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'line'" :value="edit.value" @close="(router.back(), lines.reload())">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputRecordComponent :label="$t('entity.route.route')" v-model="edit.value.route" type="route" :required="true" />
        </div>

        <h6>{{ $t('entity.stop.stop', 0) }}</h6>
        <div class="stops" v-for="stop of edit_stops.value" :key="stop.id.id.toString()">
            <div class="stops_vertical">
                <swd-input>
                    <label>Arrival Time</label>
                    <input :value="dateToTime(stop.arrival.time)" type="time">
                </swd-input>
                <swd-input>
                    <label>Departure Time</label>
                    <input :value="dateToTime(stop.departure.time)" type="time">
                </swd-input>
            </div>
            
            <div class="stops_vertical">
                <swd-input>
                    <label>Arrival Time</label>
                    <input :value="stop.arrival.platform">
                </swd-input>
                <swd-input>
                    <label>Departure Time</label>
                    <input :value="stop.departure.platform">
                </swd-input>
            </div>
            <div class="stops_vertical">
                <swd-input>
                    <label>Stop</label>
                    <input :value="stop.out.id">
                </swd-input>
                <button class="grey-color">Test</button>
            </div>

            
        </div>
    </EditFormComponent>
</template>

<style scoped>
.flex {
    margin: 0;
    --theme-element-spacing: calc(var(--theme-inner-element-spacing) / 2)
}

.stops {
    display: grid;
    gap: var(--theme-inner-element-spacing);
    grid-template-columns: fit-content(0) fit-content(0) auto;
    vertical-align: middle;
    margin-bottom: var(--theme-element-spacing);
}

.stops .stops_vertical {
    display: flex;
    flex-direction: column;
    gap: var(--theme-inner-element-spacing);
}

.stops .stops_vertical input {
    width: 100px;
}
</style>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { Line, Parameter } from '@/core/types';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import { useRoute, useRouter } from 'vue-router';
import EditFormComponent from '@/components/EditFormComponent.vue';
import { LineEditDto } from '@/core/dtos';
import InputRecordComponent from '@/components/InputRecordComponent.vue';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { dateToTime } from '@/core/functions';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealDbService') as SurrealDbService

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const lines = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Line[], number]>(`SELECT *, route.*, route.designations.{type.*, number}, route.timetable.* FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new LineEditDto(parameter.route.params.id === 'new' ? {} : await surrealdb.select<Line>(new RecordId('line', parameter.route.params.id)))
})

const edit_stops = resource({
    parameter: { edit },
    loader: async () => await surrealdb.query<Connects[][][]>('SELECT VALUE ->connects.* FROM line;').then(result => result[0][0])
})

type Connects = {
    id: RecordId<'connects'>
    in: RecordId<'line'>
    out: RecordId<'stop'>
    arrival: { 
        platform: string,
        time: Date
    },
    departure: {
        platform: string,
        time: Date
    }
}

</script>