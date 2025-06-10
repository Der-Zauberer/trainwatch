<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="routes" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.timetable.timetable') ]" @add="router.push({ name: 'studio_route_edit', params: { id: 'new' } })">
            <a v-for="route of routes.value" :key="route.id.id.toString()" @click="router.push({ name: 'studio_route_edit', params: { id: route.id.id.toString() } })">
                <div><samp class="id">{{ route.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="route" /></span>
                    {{ route.name }}
                </div>
                <div>{{ route.timetable.name }}</div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'route'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name" :required="true"/>
            <InputRecordComponent :label="$t('entity.timetable.timetable')" v-model="edit.value.timetable" type="timetable" :required="true" />
            <InputRecordComponent :label="$t('entity.operator.operator')" v-model="edit.value.operator" type="operator" :required="true" />
        </div>
        <h6>{{ $t('entity.route.designations.designations', 0) }}</h6>
        <div class="input-array" v-for="(designation, index) in edit.value.designations" :key="designation.number + designation.type">
            <InputRecordComponent :label="$t('entity.type.type')" v-model="designation.type" type="type" :required="true"/>
            <InputComponent :label="$t('entity.route.designations.number')" v-model="designation.number" :required="true"/>
            <button class="grey-color" @click.prevent="edit.value.designations.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
        </div>
        <button class="grey-color" @click.prevent="edit.value.designations.push({ type: undefined, number: '' })"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
    </EditFormComponent>
</template>

<style scoped>
.flex {
    margin: 0;
    --theme-element-spacing: calc(var(--theme-inner-element-spacing) / 2)
}

.input-array {
    display: grid;
    grid-template-columns: repeat(2, 1fr) fit-content(0);
    gap: var(--theme-inner-element-spacing);
    margin-bottom: var(--theme-element-spacing);
    align-items: center;
}
</style>

<script setup lang="ts">
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputRecordComponent from '@/components/InputRecordComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { RouteEditDto } from '@/core/dtos';
import { resource } from '@/core/resource';
import type { Parameter, Route } from '@/core/types';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealDbService') as SurrealDbService

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const routes = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Route[], number]>(`SELECT *, designations.{type.*, number}, timetable.* FROM route ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM route ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new RouteEditDto(parameter.route.params.id === 'new' ? {} : await surrealdb.select(new RecordId('route', parameter.route.params.id)))
})

const actions: EditActions = {
    save: async (id?: RecordId) => id === undefined ? await surrealdb.insert(edit.value?.filterBeforeSubmit()) : await surrealdb.update(id, edit.value?.filterBeforeSubmit()),
    delete: async (id: RecordId) => await surrealdb.delete(id),
    close: () => (router.back(), routes.reload())
}

</script>