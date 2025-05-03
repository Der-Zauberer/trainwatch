<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="journeys" :header="[ $t('entity.general.id'), $t('entity.general.name') ]"  @add="router.push({ name: 'studio_journey_edit', params: { id: 'new' } })">
            <div v-for="journey of journeys.value" :key="journey.id.id.toString()" @click="router.push({ name: 'studio_journey_edit', params: { id: journey.id.id.toString() } })">
                <div><samp class="id">{{ journey.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="journey.line.route" /></span>
                    {{ journey.line.route.name }}
                </div>
            </div>
        </TableComponent>
    </div>

    <div class="container-xl" v-if="route.params.id">
        <EditFormComponent v-if="edit.value" :id="edit.value.id" :name="''" :events="events">
            <h6>{{ $t('entity.general.general') }}</h6>
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
        </EditFormComponent>
    </div>
</template>

<style scoped>
.flex {
    margin: 0;
    --theme-element-spacing: calc(var(--theme-inner-element-spacing) / 2)
}
</style>

<script setup lang="ts">
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import EditFormComponent from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Journey, Line, Parameter } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealdb') as Surreal

const create: () => Journey = () => ({
    id: new RecordId('journey', ''),
    line: undefined as unknown as Line
})

const events = {
    close: async () => (router.back(), journeys.reload()),
    delete: async () => await surrealdb.delete(new RecordId('journey', route.params.id)),
    save: async () => route.params.id === 'new' ? await surrealdb.insert(edit.value) : await surrealdb.upsert(new RecordId('journey', route.params.id), edit.value)
}

const parameter =  reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const journeys = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Journey[], number]>(`SELECT *, line.*, line.route.*, line.route.designations.{type.*, number} FROM journey ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM journey ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => parameter.route.params.id === 'new' ? create() : await surrealdb.select<Journey>(new RecordId('journey', parameter.route.params.id))
})

</script>