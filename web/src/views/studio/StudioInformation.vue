<template>
    <div class="container-xl" v-if="!route.params.id">
        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :resource="information" :header="[ $t('entity.general.id'), $t('entity.general.name'), $t('entity.general.description') ]" @add="router.push({ name: 'studio_information_edit', params: { id: 'new' } })">
            <a v-for="info of information.value" :key="info.id.id.toString()" @click="router.push({ name: 'studio_information_edit', params: { id: info.id.id.toString() } })">
                <div><samp class="id">{{ info.id.id.toString() }}</samp></div>
                <div><swd-chip :class="informationToColor(info.type)">{{ $t('entity.information.' + info.type) }}</swd-chip> {{ info.name }}</div>
                <div>{{ info.description }}</div>
            </a>
        </TableComponent>
    </div>

    <EditFormComponent v-if="edit.value" :type="'information'" :value="edit.value" :actions="actions">
        <h6>{{ $t('entity.general.general') }}</h6>
        <div class="grid-cols-sm-2 grid-cols-1">
            <InputComponent :label="$t('entity.general.id')" :disabled="$route.params.id !== 'new'" v-model="edit.value.id.id" :required="true"/>
            <InputComponent :label="$t('entity.general.name')" v-model="edit.value.name" :required="true"/>
            <InputDropdownComponent :label="$t('entity.general.type')" v-model="edit.value.type" :display="$t('entity.information.' + edit.value.type)">
                <a v-for="type of enumToArray(InformationType)" :value="type" :key="type">{{ $t('entity.information.' + type) }}</a>
            </InputDropdownComponent>
            <InputComponent :label="$t('entity.general.description')" v-model="edit.value.description" :required="true"/>
        </div>

        <h6>{{ $t('entity.general.content') }}</h6>
        <swd-input>
            <label>{{ $t('entity.general.content') }}</label>
            <textarea v-model="edit.value.content"></textarea>
        </swd-input>
    </EditFormComponent>
</template>

<script setup lang="ts">
import EditFormComponent, { type EditActions } from '@/components/EditFormComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import InputDropdownComponent from '@/components/InputDropdownComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { InformationEditDto } from '@/core/dtos';
import { enumToArray, informationToColor } from '@/core/functions';
import { resource } from '@/core/resource';
import { InformationType, type Information, type Parameter } from '@/core/types';
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const parameter = reactive<Parameter>({ search: '', page: 1, size: 100, count: 0 })
const information = resource({
    parameter,
	loader: async (parameter) => {
        const [result, count] = await surrealdb.query<[Information[], number]>(`SELECT * FROM information ${parameter.search ? 'WHERE name.lowercase().starts_with($search.lowercase())' : ''} START ($page - 1) * $size LIMIT $size; (SELECT count() FROM information ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const edit = resource({
    parameter: { route },
	loader: async (parameter) => new InformationEditDto(parameter.route.params.id === 'new' ? {} : await surrealdb.select(new RecordId('information', parameter.route.params.id)))
})

const actions: EditActions = {
    save: async (id?: RecordId) => id === undefined ? await surrealdb.insert(edit.value?.filterBeforeSubmit()) : await surrealdb.update(id, edit.value?.filterBeforeSubmit()),
    delete: async (id: RecordId) => await surrealdb.delete(id),
    close: () => (router.back(), information.reload())
}

</script>