<template>
    <swd-dropdown>
        <swd-input @click="focusSearch()">
            <label :for="toId(id)"> {{ label }}</label>
            <input :id="toId(id)" readonly :value="(model || '').toString()" @keydown.delete="model = undefined" :required="required ? 'true' : undefined">
            <swd-icon class="down-icon" swd-input-icon></swd-icon>
        </swd-input>
        <swd-dropdown-content class="dropdown-content">
            <swd-input class="dropdown-content__search top-item">
                <input :placeholder="$t('action.search')" v-model="parameter.search" ref="search">
            </swd-input>
            <swd-selection class="bottom-item" @select.prevent>
                <a v-for="record of records.value" :key="record.id.toString()" :value="record.id.toString()" @click="model = record.id">
                    {{ record.name }} 
                    <swd-subtitle>{{ record.id.toString() }}</swd-subtitle>
                </a>
            </swd-selection>
        </swd-dropdown-content>
    </swd-dropdown>
</template>

<style>

.dropdown-content .dropdown-content__search {
    position: sticky;
    top: 0;
}

</style>

<script setup lang="ts">
import { resource } from '@/core/resource';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { type RecordId } from 'surrealdb';
import { inject, reactive, useTemplateRef } from 'vue';

const surrealdb = inject('surrealDbService') as SurrealDbService

const props = defineProps<{ id?: string, label: string, type: string, required: boolean}>()
const model = defineModel()

const search = useTemplateRef('search')

const focusSearch = () => setTimeout(() => search?.value?.focus(), 0)

const toId = (id?: string) => id ? id : 'input-' + props.label.toLocaleLowerCase().replace(/\s+/, '-')

const parameter = reactive({ search: '' })
const records = resource({
    parameter,
    loader: (parameter) => surrealdb.query<{ id: RecordId, name: string }[][]>(`SELECT * FROM ${props.type} ${ parameter.search ? 'WHERE fn::search::normalize(name) CONTAINS fn::search::normalize($search)' : '' } LIMIT 50;`, parameter).then(result => result[0])
})

</script>