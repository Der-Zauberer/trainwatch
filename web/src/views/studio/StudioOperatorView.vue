<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :resource="operators" :header="[ $t('entity.general.id'), $t('entity.general.name') ]" @add="router.push({ name: 'studio_operator_edit', params: { id: 'new' } })">
            <a v-for="operator of operators.value" :key="operator.id.id.toString()" @click="router.push({ name: 'studio_operator_edit', params: { id: operator.id.id.toString() } })">
                <div><samp class="id">{{ operator.id.id.toString() }}</samp></div>
                <div>{{ operator.name }}<swd-subtitle v-if="operator.address?.federalState || operator.address?.country">{{ [operator.address.federalState, operator.address.country].join(', ') }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'operator'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" :modelValue="edit.value.id.id" @update:modelValue="edit.value.id = markRaw(new RecordId('operator', $event))" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name" :required="true"/>
            <InputComponent :label="$t('entity.operator.website')" v-model="edit.value.website"/>
        </div>
        <h6>{{ $t('entity.address.address') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.address.street')" v-model="edit.value.address.street" class="grid-span-sm-2 grid-span-1"/>
            <InputComponent :label="$t('entity.address.zipcode')" v-model="edit.value.address.zipcode"/>
            <InputComponent :label="$t('entity.address.city')" v-model="edit.value.address.city"/>
            <InputComponent :label="$t('entity.address.federalState')" v-model="edit.value.address.federalState"/>
            <InputComponent :label="$t('entity.address.country')" v-model="edit.value.address.country"/>
            <InputComponent :label="$t('entity.address.email')" type="email" v-model="edit.value.address.email"/>
            <InputComponent :label="$t('entity.address.phone')" type="tel" v-model="edit.value.address.phone"/>
        </div>
    </EditFormComponent>
</template>

<script setup lang="ts">
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import TableComponent from '@/components/TableComponent.vue'
import { OperatorEditDto } from '@/core/dtos'
import { resource } from '@/core/resource'
import type { Operator, Parameter } from '@/core/types'
import { useSurrealDbService } from '@/services/surrealdb.service'
import { RecordId } from 'surrealdb'
import { markRaw, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const surreal = useSurrealDbService()

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const operators = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surreal.up().then(() => surreal.query<[Operator[], number]>(`SELECT * FROM operator ${parameter.search ? 'WHERE name.lowercase().starts_with($search.lowercase())' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM operator ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter))
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new OperatorEditDto(parameter.route.params.id === 'new' ? {} : await surreal.up().then(() => surreal.select(new RecordId('operator', parameter.route.params.id))))
})

const actions: EditActions = {
    save: async (id?: RecordId) => surreal.up().then(async () => id === undefined ? await surreal.insert(edit.value?.filterBeforeSubmit() as any) : await surreal.update(id).content(edit.value?.filterBeforeSubmit() as any)),
    delete: async (id: RecordId) => await surreal.up().then(() => surreal.delete(id)),
    close: () => (router.back(), operators.reload())
}

</script>