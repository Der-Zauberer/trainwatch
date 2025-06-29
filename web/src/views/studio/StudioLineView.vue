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

    <EditFormComponent v-if="edit.value" :type="'line'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputRecordComponent :label="$t('entity.route.route')" v-model="edit.value.route" type="route" :required="true" :to="edit.value.route?.id ? { name: 'studio_route_edit', params: { id: edit.value.route?.id.toString() } }: undefined" />
        </div>

        <h6>{{ $t('entity.stop.stop', 0) }}</h6>
        <div class="stops" v-for="stop of edit_stops.value" :key="stop.id.id.toString()">
            <swd-input>
                <label>{{ $t('entity.traffic.arrivaltime') }}</label>
                <input :value="dateToTime(stop.arrival.time)" @input="stop.arrival.time = timeToDate(($event.target as HTMLInputElement).value)" type="time">
                <div style="height: round(.5em, 1px)"></div>
                <label>{{ $t('entity.traffic.departuretime') }}</label>
                <input :value="dateToTime(stop.departure.time)" @input="stop.departure.time = timeToDate(($event.target as HTMLInputElement).value)"  type="time">
            </swd-input>
            
            <swd-input>
                <label>{{ $t('entity.traffic.arrivalplatform') }}</label>
                <input v-model="stop.arrival.platform">
                <div style="height: round(.5em, 1px)"></div>
                <label>{{ $t('entity.traffic.departureplatform') }}</label>
                <input v-model="stop.departure.platform">
            </swd-input>

            <div v-if="edit_stops.value" class="stops_vertical">
                <InputRecordComponent :label="$t('entity.stop.stop')" v-model="stop.out" type="stop" :required="true"  :to="stop.out.id ? { name: 'studio_stop_edit', params: { id: stop.out.id.toString() } } : undefined"/>
                <button class="grey-color" @click="connectsToRemove.push(edit_stops.value.splice(edit_stops.value.indexOf(stop), 1)[0])"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
        </div>
        <button class="grey-color" @click.prevent="edit_stops.value?.push(createEmptyConnects(edit.value.id))"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
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
    grid-template-columns: fit-content(150px) fit-content(150px) auto;
    vertical-align: middle;
    margin-bottom: var(--theme-element-spacing);
}

.stops .stops_vertical {
    display: flex;
    flex-direction: column;
    gap: var(--theme-inner-element-spacing);
}

.stop-table {
    display: grid;
    grid-template-columns: fit-content(200px) fit-content(200px) auto;
    gap: var(--theme-inner-element-spacing);
    vertical-align: middle;
    margin-bottom: var(--theme-element-spacing);
}
</style>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { Line, Parameter } from '@/core/types';
import { RecordId, surql } from 'surrealdb';
import { inject, reactive } from 'vue';
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import { useRoute, useRouter } from 'vue-router';
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue';
import { LineEditDto } from '@/core/dtos';
import InputRecordComponent from '@/components/InputRecordComponent.vue';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { dateToTime, guid, timeToDate } from '@/core/functions';

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
    loader: async () => {
        if (!edit.value?.id) return []
        return await surrealdb.query<Connects[][][]>(surql`SELECT VALUE ->connects.* FROM ${edit.value.id};`).then(result => result[0][0].sort((a, b) => a.departure.time.getTime() - b.departure.time.getTime()))
    }
})

const connectsToAdd: Connects[] = []
const connectsToRemove: Connects[] = []

const actions: EditActions = {
    save: async (id?: RecordId) => {
        await surrealdb.query(surql`
            BEGIN TRANSACTION;

            IF ${id === undefined} {
                INSERT INTO line ${edit.value?.filterBeforeSubmit()};
            } ELSE {
                UPDATE ${id} CONTENT ${edit.value?.filterBeforeSubmit()};
            };

            FOR $connects IN ${connectsToAdd} {
                LET $line = $connects.in;
                LET $stop = $connects.out;
                RELATE $line->connects->$stop CONTENT $connects;
            };

            FOR $connects IN ${connectsToRemove} {
                DELETE $connects.id;
            };

            FOR $connects IN ${edit_stops.value?.filter(connects => !connectsToAdd.includes(connects))} {
                UPDATE $connects.id CONTENT $connects;
            };

            COMMIT TRANSACTION;
        `);
    },
    delete: async (id: RecordId) => await surrealdb.delete(id),
    close: () => (router.back(), lines.reload())
}

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

function createEmptyConnects(line: RecordId<'line'>): Connects {
    const connects: Connects = {
        id: new RecordId('connects', guid()),
        in: line,
        out: new RecordId('stop', ''),
        arrival: {
            platform: '1',
            time: new Date('0000-01-01T00:00'),
        },
        departure: {
            platform: '1',
            time: new Date('0000-01-01T00:00'),
        }
    }
    connectsToAdd.push(connects)
    return connects
}

</script>