<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :resource="lines" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.timetable.timetable') ]" @add="router.push({ name: 'studio_line_edit', params: { id: 'new' } })" >
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
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" :modelValue="edit.value.id.id" @update:modelValue="edit.value.id = markRaw(new RecordId('line', $event))" :required="true"/>
            <InputRecordComponent :label="$t('entity.route.route')" v-model="edit.value.route" type="route" :required="true" :to="edit.value.route?.id ? { name: 'studio_route_edit', params: { id: edit.value.route?.id.toString() } }: undefined" />
        </div>

        <h6>{{ $t('entity.stop.stop', 0) }}</h6>

        <InputTableComponent :header="[ `${$t('entity.traffic.arrivaltime')}/ ${$t('entity.traffic.departuretime')}`, `${$t('entity.traffic.arrivalplatform')}/ ${$t('entity.traffic.departureplatform')}`, $t('entity.stop.stop'), '' ]" columns="fit-content(0) fit-content(0) auto fit-content(0)">
            <div v-for="(stop, index) of editConnects.value?.map(stop => toRaw(stop))" :key="index">
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
                <InputRecordComponent :label="$t('entity.stop.stop')" v-model="stop.out" type="stop" :required="true" :to="stop.out.id ? { name: 'studio_stop_edit', params: { id: stop.out.id.toString() } } : undefined"/>
                <button class="grey-color" @click="connectsToRemove.push(editConnects.value!.splice(editConnects.value!.indexOf(stop), 1)[0])"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
        </InputTableComponent>
        <button class="float-right grey-color" @click.prevent="editConnects.value?.push(createEmptyConnects(edit.value.id))"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
    </EditFormComponent>
</template>

<style scoped>
.flex {
    margin: 0;
    --theme-element-spacing: calc(var(--theme-inner-element-spacing) / 2)
}
</style>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import { resource } from '@/core/resource'
import type { Connects, Line, Parameter } from '@/core/types'
import { RecordId, surql } from 'surrealdb'
import { markRaw, reactive, toRaw } from 'vue'
import DesignationChipComponent from '@/components/DesignationChipComponent.vue'
import { useRoute, useRouter } from 'vue-router'
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue'
import { LineEditDto } from '@/core/dtos'
import InputRecordComponent from '@/components/InputRecordComponent.vue'
import { generateGUID, useSurrealDbService } from '@/services/surrealdb.service'
import { dateToTime, timeToDate } from '@/core/functions'
import InputTableComponent from '@/components/InputTableComponent.vue'

const route = useRoute()
const router = useRouter()
const surreal = useSurrealDbService()

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const lines = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surreal.up().then(() => surreal.query<[Line[], number]>(`SELECT *, route.*, route.designations.{type.*, number}, route.timetable.* FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter))
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new LineEditDto(parameter.route.params.id === 'new' ? {} : await surreal.up().then(() => surreal.select<Line>(new RecordId('line', parameter.route.params.id))))
})

const editConnects = resource({
    parameter: { edit },
    loader: async () => {
        if (!edit.value?.id) return []
        return await surreal.up().then(() => surreal.query<Connects[][][]>(surql`SELECT VALUE ->connects.* FROM ${edit.value!.id};`)).then(result => result[0][0].sort((a, b) => a.departure.time.getTime() - b.departure.time.getTime())) || []
    }
})

const connectsToAdd: Connects[] = []
const connectsToRemove: Connects[] = []

const actions: EditActions = {
    save: async (id?: RecordId) => {
        console.log(id, toRaw(edit.value), toRaw(connectsToAdd), toRaw(connectsToRemove), toRaw(editConnects.value?.filter(connects => !connectsToAdd.includes(toRaw(connects)))))
        await surreal.up().then(() => surreal.query(surql`
            --BEGIN TRANSACTION;

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

            FOR $connects IN ${editConnects.value?.filter(connects => !connectsToAdd.includes(toRaw(connects)))} {
                UPDATE $connects.id CONTENT $connects;
            };

            --COMMIT TRANSACTION;
        `));
    },
    delete: async (id: RecordId) => await surreal.up().then(() => surreal.delete(id)),
    close: () => (router.back(), lines.reload())
}

function createEmptyConnects(line: RecordId<'line'>): Connects {
    const connects: Connects = {
        id: new RecordId('connects', generateGUID()),
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