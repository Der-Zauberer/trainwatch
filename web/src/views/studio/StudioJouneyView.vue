<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :resource="journeys" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.timetable.timetable') ]"  @add="router.push({ name: 'studio_journey_edit', params: { id: 'new' } })">
            <div v-for="journey of journeys.value" :key="journey.id.id.toString()" @click="router.push({ name: 'studio_journey_edit', params: { id: journey.id.id.toString() } })">
                <div><samp class="id">{{ journey.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="journey.line.route" /></span>
                    {{ journey.line.route.name }}
                </div>
                <div>{{ journey.line.route.timetable.name }}</div>
            </div>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'role'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputRecordComponent :label="$t('entity.line.line')" v-model="edit.value.line" type="line" :required="true" :to="edit.value.line?.id ? { name: 'studio_line_edit', params: { id: edit.value.line?.id.toString() } } : undefined"/>
        </div>
        <div class="stops" v-for="stop of editVisits.value" :key="stop.id.id.toString()">
            <swd-input>
                <label>{{ $t('entity.traffic.arrivaltime') }}</label>
                <input :value="dateToTime(stop.realtime.arrival.time)" @input="stop.realtime.arrival.time = timeToDate(($event.target as HTMLInputElement).value)" type="time">
                <div style="height: round(.5em, 1px)"></div>
                <label>{{ $t('entity.traffic.departuretime') }}</label>
                <input :value="dateToTime(stop.realtime.departure.time)" @input="stop.realtime.departure.time = timeToDate(($event.target as HTMLInputElement).value)"  type="time">
            </swd-input>

            <swd-input>
                <label>{{ $t('entity.traffic.arrivalplatform') }}</label>
                <input v-model="stop.realtime.arrival.platform">
                <div style="height: round(.5em, 1px)"></div>
                <label>{{ $t('entity.traffic.departureplatform') }}</label>
                <input v-model="stop.realtime.departure.platform">
            </swd-input>

            <swd-input>
                <label>{{ $t('entity.traffic.canceled') }}</label>
                <input v-model="stop.canceled" type="checkbox">
            </swd-input>
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
    grid-template-columns: fit-content(150px) fit-content(150px) auto;
    vertical-align: middle;
    margin-bottom: var(--theme-element-spacing);
}
</style>

<script setup lang="ts">
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputRecordComponent from '@/components/InputRecordComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { JourneyEditDto } from '@/core/dtos';
import { dateToTime, timeToDate } from '@/core/functions';
import { resource } from '@/core/resource';
import type { Connects, Journey, Parameter, Visits } from '@/core/types';
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service';
import { RecordId, surql } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const parameter =  reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const journeys = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Journey[], number]>(`SELECT *, line.*, line.route.*, line.route.designations.{type.*, number}, line.route.timetable.* FROM journey ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM journey ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new JourneyEditDto(parameter.route.params.id === 'new' ? {} : await surrealdb.select<Journey>(new RecordId('journey', parameter.route.params.id)))
})

const editVisits = resource({
    parameter: { edit },
    loader: async () => {
        if (!edit.value?.id) return []
        return await surrealdb.query<Visits[][][]>(surql`SELECT VALUE (SELECT *, sceduled.* FROM ->visits) FROM ${edit.value.id};`).then(result => result[0][0].sort((a, b) => a.sceduled.departure.time.getTime() - b.sceduled.departure.time.getTime()))
    }
})

const actions: EditActions = {
    save: async (id?: RecordId) => {
        await surrealdb.query(surql`
            BEGIN TRANSACTION;

            IF ${id === undefined} {
                LET $journey = (INSERT INTO journey ${edit.value?.filterBeforeSubmit()})[0];
                FOR $connects IN (SELECT VALUE line->connects.* FROM ONLY $journey.id) {
                    INSERT RELATION INTO visits {
                        in: $journey.id,
                        out: $connects.out,
                        canceled: false,
                        sceduled: $connects.id,
                        realtime: {
                            arrival: $connects.arrival,
                            departure: $connects.departure
                        }
                    };
                }
            } ELSE {
                UPDATE ${id} CONTENT ${edit.value?.filterBeforeSubmit()};
                FOR $visit IN ${editVisits.value?.map(visit => (visit.sceduled = visit.sceduled.id as unknown as Connects, visit))} {
                    UPDATE $visit.id CONTENT $visit;
                };
            };

            COMMIT TRANSACTION;       
        `)
    },
    delete: async (id: RecordId) => await surrealdb.delete(id),
    close: () => (router.back(), journeys.reload())
}

/*
function createEmptyVisits(journey: RecordId<'journey'>): Visits {
    const visits: Visits = {
        id: new RecordId('visits', surealdb.generateGUID()),
        in: journey,
        out: new RecordId('stop', ''),
        cancelled: false,
        sceduled: undefined as unknown as RecordId<'line'>,
        realtime: {
            arrival: {
                platform: '1',
                time: new Date('0000-01-01T00:00'),
            },
            departure: {
                platform: '1',
                time: new Date('0000-01-01T00:00'),
            }
        }
    }
    //connectsToAdd.push(connects)
    return visits
}
*/

</script>