<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :resource="timetables" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="router.push({ name: 'studio_timetable_edit', params: { id: 'new' } })">
            <a v-for="role of timetables.value" :key="role.id.id.toString()" @click="router.push({ name: 'studio_timetable_edit', params: { id: role.id.id.toString() } })">
                <div><samp class="id">{{ role.id.id.toString() }}</samp></div>
                <div>{{ role.name }}</div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'timetable'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" :modelValue="edit.value.id.id" @update:modelValue="edit.value.id = markRaw(new RecordId('timetable', $event))" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name" :required="true"/>
        </div>
    </EditFormComponent>
</template>

<script setup lang="ts">
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import TableComponent from '@/components/TableComponent.vue'
import { TimetableEditDto } from '@/core/dtos'
import { resource } from '@/core/resource'
import type { Parameter, Timetable } from '@/core/types'
import { useSurrealDbService } from '@/services/surrealdb.service'
import { RecordId } from 'surrealdb'
import { markRaw, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'


const route = useRoute()
const router = useRouter()
const surreal = useSurrealDbService()

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const timetables = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surreal.up().then(() => surreal.query<[Timetable[], number]>(`SELECT * FROM timetable ${parameter.search ? 'WHERE name.lowercase().starts_with($search.lowercase())' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM route ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter))
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new TimetableEditDto(parameter.route.params.id === 'new' ? {} : await surreal.up().then(() => surreal.select<Timetable>(new RecordId('timetable', parameter.route.params.id))))
})

const actions: EditActions = {
    save: async (id?: RecordId) => surreal.up().then(async () => id === undefined ? await surreal.insert(edit.value?.filterBeforeSubmit() as any) : await surreal.update(id).content(edit.value?.filterBeforeSubmit() as any)),
    delete: async (id: RecordId) => await surreal.up().then(() => surreal.delete(id)),
    close: () => (router.back(), timetables.reload())
}

</script>