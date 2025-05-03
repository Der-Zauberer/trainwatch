<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="routes" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="router.push({ name: 'studio_route_edit', params: { id: 'new' } })">
            <a v-for="route of routes.value" :key="route.id.id.toString()" @click="router.push({ name: 'studio_route_edit', params: { id: route.id.id.toString() } })">
                <div><samp class="id">{{ route.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="route" /></span>
                    {{ route.name }}
                </div>
            </a>
        </TableComponent>
    </div>

    <div class="container-xl" v-if="route.params.id">
        <EditFormComponent v-if="edit.value" :id="edit.value.id" :name="edit.value.name" :events="events">
            <h6>{{ $t('entity.general.general') }}</h6>
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name" :required="true"/>
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
import type { Parameter, Route } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealdb') as Surreal

const create: () => Route = () => ({
    id: new RecordId('route', ''),
    name: '',
    designations: [],
    operator: undefined
})

const events = {
    close: async () => (router.back(), routes.reload()),
    delete: async () => await surrealdb.delete(new RecordId('route', route.params.id)),
    save: async () => route.params.id === 'new' ? await surrealdb.insert(edit.value) : await surrealdb.upsert(new RecordId('route', route.params.id), edit.value)
}

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const routes = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Route[], number]>(`SELECT *, designations.{type.*, number} FROM route ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM route ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => parameter.route.params.id === 'new' ? create() : await surrealdb.select<Route>(new RecordId('route', parameter.route.params.id))
})

</script>