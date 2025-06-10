<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="journeys" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.timetable.timetable') ]"  @add="router.push({ name: 'studio_journey_edit', params: { id: 'new' } })">
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
            <InputRecordComponent :label="$t('entity.line.line')" v-model="edit.value.line" type="line" :required="true"/>
        </div>        
    </EditFormComponent>
</template>

<style scoped>
.flex {
    margin: 0;
    --theme-element-spacing: calc(var(--theme-inner-element-spacing) / 2)
}
</style>

<script setup lang="ts">
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputRecordComponent from '@/components/InputRecordComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { JourneyEditDto } from '@/core/dtos';
import { resource } from '@/core/resource';
import type { Journey, Parameter } from '@/core/types';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealDbService') as SurrealDbService

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

const actions: EditActions = {
    save: async (id?: RecordId) => id === undefined ? await surrealdb.insert(edit.value?.filterBeforeSubmit()) : await surrealdb.update(id, edit.value?.filterBeforeSubmit()),
    delete: async (id: RecordId) => await surrealdb.delete(id),
    close: () => (router.back(), journeys.reload())
}

</script>