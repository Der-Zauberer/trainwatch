<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" :resource="stops" @add="router.push({ name: 'studio_stop_edit', params: { id: 'new' } })">
            <a v-for="stop of stops.value" :key="stop.id.id.toString()" @click="router.push({ name: 'studio_stop_edit', params: { id: stop.id.id.toString() } })">
                <div><samp class="id">{{ stop.id.id.toString() }}</samp></div>
                <div>{{ stop.name }}<swd-subtitle v-if="stop.address?.federalState || stop.address?.country">{{ [stop.address.federalState, stop.address.country].join(', ') }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'stop'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name"/>
            <InputComponent :label="$t('entity.stop.score')" type="number" v-model.number="edit.value.score"/>
        </div>
        <h6>{{ $t('entity.location.location') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.location.latitude')" type="number" step="any" v-model.number="edit.value.location.latitude"/>
            <InputComponent :label="$t('entity.location.longitude')" type="number" step="any" v-model.number="edit.value.location.longitude"/>
        </div>
        <h6>{{ $t('entity.address.address') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.address.street')" v-model="edit.value.address.street"/>
            <InputComponent :label="$t('entity.address.zipcode')" v-model="edit.value.address.zipcode"/>
            <InputComponent :label="$t('entity.address.city')" v-model="edit.value.address.city"/>
            <InputComponent :label="$t('entity.address.federalState')" v-model="edit.value.address.federalState"/>
            <InputComponent :label="$t('entity.address.country')" v-model="edit.value.address.country"/>
            <InputComponent :label="$t('entity.address.email')" type="email" v-model="edit.value.address.email"/>
            <InputComponent :label="$t('entity.address.phone')" type="tel" v-model="edit.value.address.phone"/>
        </div>
        <h6>{{ $t('entity.stop.open.open') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.stop.open.monday')" v-model="edit.value.open.monday"/>
            <InputComponent :label="$t('entity.stop.open.tuesday')" v-model="edit.value.open.tuesday"/>
            <InputComponent :label="$t('entity.stop.open.wednesday')" v-model="edit.value.open.wednesday"/>
            <InputComponent :label="$t('entity.stop.open.thursday')" v-model="edit.value.open.thursday"/>
            <InputComponent :label="$t('entity.stop.open.friday')" v-model="edit.value.open.friday"/>
            <InputComponent :label="$t('entity.stop.open.saturday')" v-model="edit.value.open.saturday"/>
            <InputComponent :label="$t('entity.stop.open.sunday')" v-model="edit.value.open.sunday"/>
        </div>
        <h6>{{ $t('entity.stop.platforms.platforms') }}</h6>
        <div class="input-array" v-for="(platform, index) in edit.value.platforms" :key="index">
            <InputComponent :id="`${$t('entity.general.name')}-${index}`" :label="$t('entity.general.name')" v-model="edit.value.platforms[index].name"/>
            <InputComponent :id="`${$t('entity.stop.platforms.length')}-${index}`" :label="$t('entity.stop.platforms.length') + ' (m)'" type="number" step="any" v-model.number="edit.value.platforms[index].height"/>
            <InputComponent :id="`${$t('entity.stop.platforms.height')}-${index}`" :label="$t('entity.stop.platforms.height') + ' (mm)'" type="number" v-model.number="edit.value.platforms[index].length"/>
            <InputComponent :id="`${$t('entity.stop.platforms.linkedPlatforms')}-${index}`" :label="$t('entity.stop.platforms.linkedPlatforms')" :value="edit.value.platforms[index].linkedPlatforms.toString()" @input="edit.value.platforms[index].linkedPlatforms = ($event.target as HTMLInputElement).value.split(/\s*,\s*/)"/>
            <button class="grey-color" @click.prevent="edit.value.platforms.splice(index, 1);"><swd-icon class="delete-icon"></swd-icon></button>
        </div>
        <button class="grey-color" @click.prevent="edit.value.platforms.push({ name: '', height: 0, length: 0, linkedPlatforms: [] })"><swd-icon class="add-icon"></swd-icon> {{ $t('action.add') }}</button>
    </EditFormComponent>

</template>

<style scoped>

.input-array {
    display: grid;
    grid-template-columns: auto repeat(3, fit-content(200px)) fit-content(0);
    gap: var(--theme-inner-element-spacing);
    margin-bottom: var(--theme-element-spacing);
    align-items: center;
}

</style>

<script setup lang="ts">
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { StopEditDto } from '@/core/dtos';
import { resource } from '@/core/resource';
import type { Parameter, Stop } from '@/core/types';
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const route = useRoute()
const router = useRouter()

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const stops = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Stop[], number]>(`SELECT * FROM stop ${parameter.search ? 'WHERE name.lowercase().starts_with($search.lowercase())' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM stop ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new StopEditDto(parameter.route.params.id === 'new' ? {} : await surrealdb.select(new RecordId('stop', parameter.route.params.id)))
})

const actions: EditActions = {
    save: async (id?: RecordId) => id === undefined ? await surrealdb.insert(edit.value?.filterBeforeSubmit()) : await surrealdb.update(id, edit.value?.filterBeforeSubmit()),
    delete: async (id: RecordId) => await surrealdb.delete(id),
    close: () => (router.back(), stops.reload())
}

</script>