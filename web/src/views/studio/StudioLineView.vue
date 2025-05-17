<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent v-model="parameter" :resource="lines" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="router.push({ name: 'studio_line_edit', params: { id: 'new' } })" >
            <a v-for="line of lines.value" :key="line.id.id.toString()"  @click="router.push({ name: 'studio_line_edit', params: { id: line.id.id.toString() } })">
                <div><samp class="id">{{ line.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span><DesignationChipComponent :type="line.route"/></span>
                    {{ line.route.name }}
                </div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'line'" :value="edit.value" @close="(router.back(), lines.reload())">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputRecordComponent :label="$t('entity.route.route')" v-model="edit.value.route" type="route" :required="true" />
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
import TableComponent from '@/components/TableComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { Line, Parameter } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import DesignationChipComponent from '@/components/DesignationChipComponent.vue';
import { useRoute, useRouter } from 'vue-router';
import EditFormComponent from '@/components/EditFormComponent.vue';
import { LineEditDto } from '@/core/dtos';
import InputRecordComponent from '@/components/InputRecordComponent.vue';

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const lines = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Line[], number]>(`SELECT *, route.designations.{type.*, number} FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM line ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new LineEditDto(parameter.route.params.id === 'new' ? {} : await surrealdb.select<Line>(new RecordId('line', parameter.route.params.id)))
})

</script>